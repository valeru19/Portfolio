import { panelViewFor, readPanelViewAttr } from "../model/panelView";
import { prefersReducedMotion } from "../model/prefersReducedMotion";

import {
  PANEL_BLUR_HANDOFF_MS,
  PANEL_VIEW_MS,
  animateLayerOpacity,
  type LayerAnimHandle,
} from "./panelLayerAnimator";
import {
  applyViewInstant,
  nextFrame,
  solidCoverOf,
  veilOf,
  type PanelNodesLike,
} from "./panelViewDom";
import {
  bumpPanelViewGeneration,
  currentPanelViewGeneration,
  fadeCoverToReveal,
  forceSolidInstant,
  prepareBlurUnderCover,
  prepareSharpUnderCover,
  transitionBlurToSharp,
  transitionSharpToBlur,
  transitionSolidToSharp,
  transitionToSolid,
} from "./panelViewTransitions";
import { decodePanelImages, rememberPanelIntrinsicHeight } from "./panelReveal";

export type TurnPlan = {
  fromIdx: number;
  destIdx: number;
  sectionCount: number;
  longJump: boolean;
  /** true = Наверх / шаг назад. */
  goingBack: boolean;
  durationSec: number;
  panels: Map<number, PanelNodesLike>;
  /**
   * Ход через круг: from→dest; dest+1 (вторая после wrap) —
   * blur под cover заранее, fade cover во время хода.
   */
  wrapsRing?: boolean;
};

export type TurnHandle = {
  gen: number;
  cancel: () => void;
  /**
   * Длинный ход: вызвать, когда осталось ≤90° — проявить dest (active) и next (blur).
   * До этого все панели flat.
   */
  onNearLand?: () => void;
};

/** Батч 1–2 панели → flat (solid), без мгновенного force на всех сразу. */
async function flattenPanelsBatched(
  panels: Map<number, PanelNodesLike>,
  gen: number,
  durationMs: number,
  skip?: ReadonlySet<number>,
): Promise<void> {
  const indices = [...panels.keys()].sort((a, b) => a - b);
  for (let i = 0; i < indices.length; i += 2) {
    if (gen !== currentPanelViewGeneration()) return;
    const batch = [indices[i], indices[i + 1]].filter(
      (idx): idx is number => idx != null && !(skip?.has(idx) ?? false),
    );
    await Promise.all(
      batch.map(async (idx) => {
        const nodes = panels.get(idx);
        if (!nodes) return;
        if (readPanelViewAttr(nodes.section) === "solid") return;
        await transitionToSolid(nodes, gen, durationMs);
      }),
    );
  }
}

/** Проявление посадки длинного хода: dest → active, dest+1 → next. */
function revealLongJumpLanding(
  panels: Map<number, PanelNodesLike>,
  destIdx: number,
  nextBlurIdx: number,
  gen: number,
  viewMs: number,
  handles: LayerAnimHandle[],
): void {
  if (gen !== currentPanelViewGeneration()) return;
  const destNodes = panels.get(destIdx);
  const nextNodes = nextBlurIdx >= 0 ? panels.get(nextBlurIdx) : undefined;

  void (async () => {
    if (destNodes) {
      const was = readPanelViewAttr(destNodes.section);
      if (was === "blur") {
        handles.push(transitionBlurToSharp(destNodes.section, viewMs));
      } else {
        await transitionSolidToSharp(destNodes, gen, viewMs, { ready: was === "sharp" });
      }
    }
    if (gen !== currentPanelViewGeneration()) return;
    if (nextNodes) {
      if (readPanelViewAttr(nextNodes.section) !== "blur") {
        await prepareBlurUnderCover(nextNodes);
      }
      if (gen !== currentPanelViewGeneration()) return;
      void fadeCoverToReveal(nextNodes.section, gen, viewMs);
    }
  })();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Ждём спад вуали dest, иначе при fade cover у i+2 будет 2 live backdrop.
 * Конфликт: «fade cover с первого кадра» ↔ «≤1 blur». Готовим под cover сразу,
 * fade начинаем в ходе (после handoff dest), не после посадки.
 */
async function waitDestVeilLow(destSection: HTMLElement | undefined, gen: number): Promise<void> {
  if (!destSection) return;
  const veil = veilOf(destSection);
  const start = performance.now();
  while (performance.now() - start < 420) {
    if (gen !== currentPanelViewGeneration()) return;
    if (!veil) return;
    const op = Number(getComputedStyle(veil).opacity);
    if (!Number.isFinite(op) || op < 0.15) return;
    await nextFrame();
  }
}

/**
 * Старт хода по спецификации 1.2.
 * Вперёд i+2: готовка под cover сразу; fade cover во время хода (не после посадки).
 */
export function beginPanelViewTurn(plan: TurnPlan): TurnHandle {
  const gen = bumpPanelViewGeneration();
  const durationMs = Math.max(PANEL_VIEW_MS, plan.durationSec * 1000);
  const viewMs = Math.min(PANEL_VIEW_MS, durationMs);
  const handles: LayerAnimHandle[] = [];
  const { fromIdx, destIdx, sectionCount, longJump, goingBack, panels, wrapsRing } = plan;

  const oldBlurIdx = fromIdx + 1 < sectionCount ? fromIdx + 1 : -1;
  const nextBlurIdx = destIdx + 1 < sectionCount ? destIdx + 1 : -1;

  const fromNodes = panels.get(fromIdx);
  const destNodes = panels.get(destIdx);

  const cancel = () => {
    bumpPanelViewGeneration();
    for (const h of handles) h.cancel();
  };

  // ——— Wrap через круг: dest/next уже под cover (prepareRingWrapViews); остальные → flat. ———
  if (wrapsRing) {
    const prepMs = Math.min(PANEL_VIEW_MS, Math.max(150, Math.round(durationMs * 0.12)));
    const skip = new Set<number>([destIdx]);
    if (nextBlurIdx >= 0) skip.add(nextBlurIdx);
    void flattenPanelsBatched(panels, gen, prepMs, skip);
    return {
      gen,
      cancel,
      onNearLand: () => {
        revealLongJumpLanding(panels, destIdx, nextBlurIdx, gen, viewMs, handles);
      },
    };
  }

  // ——— Длинный ход без wrap: все flat; dest+next в onNearLand. ———
  if (longJump) {
    const prepMs = Math.min(PANEL_VIEW_MS, Math.max(150, Math.round(durationMs * 0.12)));
    void flattenPanelsBatched(panels, gen, prepMs);
    return {
      gen,
      cancel,
      onNearLand: () => {
        revealLongJumpLanding(panels, destIdx, nextBlurIdx, gen, viewMs, handles);
      },
    };
  }

  // ——— Один шаг назад ———
  if (goingBack) {
    const run = async () => {
      // Старая blur (i+1) сначала в solid 120–150 мс, потом blur на from.
      if (oldBlurIdx >= 0 && oldBlurIdx !== destIdx) {
        const oldBlur = panels.get(oldBlurIdx);
        if (oldBlur) {
          await transitionToSolid(oldBlur, gen, PANEL_BLUR_HANDOFF_MS);
        }
      }
      if (gen !== currentPanelViewGeneration()) return;

      for (let i = 0; i < sectionCount; i += 1) {
        const nodes = panels.get(i);
        if (!nodes) continue;
        if (i === fromIdx || i === destIdx) continue;
        if (readPanelViewAttr(nodes.section) !== "solid") forceSolidInstant(nodes);
      }

      // from: sharp → blur напрямую (cover = 0).
      if (fromNodes && fromIdx !== destIdx) {
        handles.push(transitionSharpToBlur(fromNodes.section, durationMs));
      }
      // dest: solid → sharp во время хода.
      if (destNodes && fromIdx !== destIdx) {
        void transitionSolidToSharp(destNodes, gen, durationMs);
      }
    };
    void run();
    return { gen, cancel };
  }

  // ——— Один шаг вперёд ———
  {
    for (let i = 0; i < sectionCount; i += 1) {
      const nodes = panels.get(i);
      if (!nodes) continue;
      if (i === fromIdx || i === destIdx || i === nextBlurIdx) continue;
      if (readPanelViewAttr(nodes.section) !== "solid") forceSolidInstant(nodes);
    }

    // i (from): sharp → solid во время хода.
    if (fromNodes && fromIdx !== destIdx) {
      void transitionToSolid(fromNodes, gen, durationMs);
    }
    // i+1 (dest): blur → sharp.
    if (destNodes && fromIdx !== destIdx) {
      handles.push(transitionBlurToSharp(destNodes.section, durationMs));
    }
    // i+2: готовим под cover сразу; fade после handoff dest (≤1 blur), ещё во время хода.
    if (nextBlurIdx >= 0) {
      const nextNodes = panels.get(nextBlurIdx);
      if (nextNodes) {
        void (async () => {
          await prepareBlurUnderCover(nextNodes);
          if (gen !== currentPanelViewGeneration()) return;
          await waitDestVeilLow(destNodes?.section, gen);
          if (gen !== currentPanelViewGeneration()) return;
          await fadeCoverToReveal(nextNodes.section, gen, viewMs);
        })();
      }
    }
  }

  return { gen, cancel };
}

/**
 * После посадки: idle-виды.
 * Если dest+1 уже blur с cover=0 — ничего не меняем.
 */
export async function settlePanelViewsAfterLand(
  panels: Map<number, PanelNodesLike>,
  activeIndex: number,
  sectionCount: number,
): Promise<number> {
  // Не bump gen: иначе отменится fade cover i+2 / dest+1, начатый со стартом хода.
  const gen = currentPanelViewGeneration();
  const blurIdx = activeIndex + 1 < sectionCount ? activeIndex + 1 : -1;

  for (let i = 0; i < sectionCount; i += 1) {
    if (gen !== currentPanelViewGeneration()) return gen;
    const nodes = panels.get(i);
    if (!nodes) continue;
    const want = panelViewFor(i, activeIndex, sectionCount);
    const have = readPanelViewAttr(nodes.section);

    if (want === "sharp") {
      if (have !== "sharp") {
        void transitionSolidToSharp(nodes, gen, PANEL_VIEW_MS);
      }
      rememberPanelIntrinsicHeight(nodes.scroll);
      continue;
    }

    if (want === "solid") {
      if (have !== "solid") {
        void transitionToSolid(nodes, gen, PANEL_VIEW_MS);
      }
      continue;
    }

    // want blur — если уже blur с открытым cover, не трогаем.
    if (i === blurIdx && have === "blur") {
      const cover = solidCoverOf(nodes.section);
      if (cover) {
        const op = Number(getComputedStyle(cover).opacity);
        if (Number.isFinite(op) && op < 0.05) {
          cover.style.opacity = "0";
        }
      }
      rememberPanelIntrinsicHeight(nodes.scroll);
    }
  }

  return gen;
}

/**
 * Перед wrap last→first / HUD-кругом: dest sharp и next blur под cover
 * (decode + готовый кадр). Остальные панели не включаются.
 */
export async function prepareRingWrapViews(
  panels: Map<number, PanelNodesLike>,
  destIdx: number,
  sectionCount: number,
): Promise<void> {
  const nextBlurIdx = destIdx + 1 < sectionCount ? destIdx + 1 : -1;
  const dest = panels.get(destIdx);
  const next = nextBlurIdx >= 0 ? panels.get(nextBlurIdx) : undefined;
  if (dest) await prepareSharpUnderCover(dest);
  if (next) await prepareBlurUnderCover(next);
}

/**
 * Дооткрыть blur после посадки, только если ещё solid / под cover.
 * На последней next нет — только solid впереди (ghosts).
 */
export async function revealNextBlurAfterLand(
  panels: Map<number, PanelNodesLike>,
  activeIndex: number,
  sectionCount: number,
  gen: number,
): Promise<void> {
  if (gen !== currentPanelViewGeneration()) return;

  // На последней нет live-blur next.
  if (activeIndex >= sectionCount - 1) return;

  const blurIdx = activeIndex + 1;
  if (blurIdx >= sectionCount) return;
  const nodes = panels.get(blurIdx);
  if (!nodes) return;
  const have = readPanelViewAttr(nodes.section);
  if (have === "blur") {
    const cover = solidCoverOf(nodes.section);
    if (cover) {
      const op = Number(getComputedStyle(cover).opacity);
      if (Number.isFinite(op) && op > 0.05) {
        await animateLayerOpacity(cover, 0, PANEL_VIEW_MS);
      }
    }
    return;
  }
  if (prefersReducedMotion()) {
    applyViewInstant(nodes.section, "blur");
    return;
  }
  await prepareBlurUnderCover(nodes);
  if (gen !== currentPanelViewGeneration()) return;
  await fadeCoverToReveal(nodes.section, gen, PANEL_VIEW_MS);
}

/**
 * Перед длинным ходом (шаг 17): только прогрев dest/dest+1 (decode),
 * вид остаётся flat — эффекты включаются в onNearLand (≤90°).
 * Бюджет ≤150 мс, кадры прогрева не должны быть >50 мс.
 */
export async function prepareLongJumpViews(
  panels: Map<number, PanelNodesLike>,
  destIndex: number,
  sectionCount: number,
  goingBack: boolean,
): Promise<void> {
  const deadline = performance.now() + 150;
  const nextBlur = destIndex + 1 < sectionCount ? destIndex + 1 : -1;

  const prep = async () => {
    const warm = async (nodes: PanelNodesLike | undefined) => {
      if (!nodes) return;
      decodePanelImages(nodes.section);
      rememberPanelIntrinsicHeight(nodes.scroll);
      // Остаёмся flat: не prepareSharp/BlurUnderCover (не включаем эффекты).
      if (readPanelViewAttr(nodes.section) !== "solid") {
        forceSolidInstant(nodes);
      }
    };
    await warm(panels.get(destIndex));
    if (nextBlur >= 0) await warm(panels.get(nextBlur));
    await nextFrame();
  };

  await Promise.race([prep(), sleep(Math.max(0, deadline - performance.now()))]);
  void goingBack;
}
