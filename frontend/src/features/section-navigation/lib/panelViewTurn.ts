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
  transitionToSolidContentFirst,
} from "./panelViewTransitions";
import { rememberPanelIntrinsicHeight } from "./panelReveal";

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
   * Ход через круг: только from→dest, промежуточные не мелькают,
   * blur на dest+1 — после посадки.
   */
  wrapsRing?: boolean;
};

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
export function beginPanelViewTurn(plan: TurnPlan): { gen: number; cancel: () => void } {
  const gen = bumpPanelViewGeneration();
  const durationMs = Math.max(PANEL_VIEW_MS, plan.durationSec * 1000);
  const viewMs = Math.min(PANEL_VIEW_MS, durationMs);
  const handles: LayerAnimHandle[] = [];
  const { fromIdx, destIdx, sectionCount, longJump, goingBack, panels, wrapsRing } = plan;

  const oldBlurIdx = fromIdx + 1 < sectionCount ? fromIdx + 1 : -1;
  const nextBlurIdx = destIdx + 1 < sectionCount ? destIdx + 1 : -1;

  const fromNodes = panels.get(fromIdx);
  const destNodes = panels.get(destIdx);

  // ——— Wrap: dest заранее под cover + opacity 0 → показать и снять cover. ———
  if (wrapsRing) {
    for (let i = 0; i < sectionCount; i += 1) {
      const nodes = panels.get(i);
      if (!nodes) continue;
      if (i === fromIdx || i === destIdx) continue;
      if (readPanelViewAttr(nodes.section) !== "solid") forceSolidInstant(nodes);
    }
    if (fromNodes) void transitionToSolid(fromNodes, gen, durationMs);
    if (destNodes) {
      // Появление по канону: opacity 1, контент уже под cover → fade cover.
      destNodes.section.style.opacity = "1";
      destNodes.section.style.visibility = "visible";
      void transitionSolidToSharp(destNodes, gen, durationMs);
    }
    return {
      gen,
      cancel: () => {
        bumpPanelViewGeneration();
        for (const h of handles) h.cancel();
      },
    };
  }

  // ——— Длинный reverse (legacy Наверх): dest/dest+1 уже под cover в prepareJump ———
  if (longJump && goingBack) {
    for (let i = 0; i < sectionCount; i += 1) {
      const nodes = panels.get(i);
      if (!nodes) continue;
      if (i === destIdx || i === nextBlurIdx) continue;
      if (i === fromIdx) {
        // Стартовая: контент выкл сразу, заливка за первую половину полёта.
        void transitionToSolidContentFirst(nodes, gen, durationMs / 2);
        continue;
      }
      forceSolidInstant(nodes);
    }

    if (destNodes) {
      // Cover спадает сразу со стартом: секция 1 резкая во время полёта.
      void fadeCoverToReveal(destNodes.section, gen, viewMs);
    }
    if (nextBlurIdx >= 0) {
      const nextNodes = panels.get(nextBlurIdx);
      if (nextNodes) {
        void fadeCoverToReveal(nextNodes.section, gen, viewMs);
      }
    }

    return {
      gen,
      cancel: () => {
        bumpPanelViewGeneration();
        for (const h of handles) h.cancel();
      },
    };
  }

  // ——— Длинный вперёд (HUD / клавиши): готовятся dest и dest+1 ———
  if (longJump && !goingBack) {
    const run = async () => {
      // Если перед стартом жива другая blur — уходит в solid, потом открываем dest+1.
      if (oldBlurIdx >= 0 && oldBlurIdx !== nextBlurIdx && oldBlurIdx !== destIdx) {
        const oldBlur = panels.get(oldBlurIdx);
        if (oldBlur && readPanelViewAttr(oldBlur.section) === "blur") {
          await transitionToSolid(oldBlur, gen, PANEL_BLUR_HANDOFF_MS);
        }
      }
      if (gen !== currentPanelViewGeneration()) return;

      for (let i = 0; i < sectionCount; i += 1) {
        const nodes = panels.get(i);
        if (!nodes) continue;
        if (i === fromIdx || i === destIdx || i === nextBlurIdx) continue;
        forceSolidInstant(nodes);
      }

      if (fromNodes && fromIdx !== destIdx) {
        void transitionToSolid(fromNodes, gen, durationMs);
      }
      if (destNodes && fromIdx !== destIdx) {
        const destWas = readPanelViewAttr(destNodes.section);
        if (destWas === "blur") {
          handles.push(transitionBlurToSharp(destNodes.section, durationMs));
        } else {
          void transitionSolidToSharp(destNodes, gen, durationMs);
        }
      }
      if (nextBlurIdx >= 0) {
        const nextNodes = panels.get(nextBlurIdx);
        if (nextNodes) {
          await prepareBlurUnderCover(nextNodes);
          if (gen !== currentPanelViewGeneration()) return;
          await waitDestVeilLow(destNodes?.section, gen);
          if (gen !== currentPanelViewGeneration()) return;
          void fadeCoverToReveal(nextNodes.section, gen, viewMs);
        }
      }
    };
    void run();
    return {
      gen,
      cancel: () => {
        bumpPanelViewGeneration();
        for (const h of handles) h.cancel();
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
    return {
      gen,
      cancel: () => {
        bumpPanelViewGeneration();
        for (const h of handles) h.cancel();
      },
    };
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

  return {
    gen,
    cancel: () => {
      bumpPanelViewGeneration();
      for (const h of handles) h.cancel();
    },
  };
}

/**
 * После посадки: idle-виды.
 * На Наверх / если dest+1 уже blur с cover=0 — ничего не меняем.
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
      applyViewInstant(nodes.section, "sharp");
      rememberPanelIntrinsicHeight(nodes.scroll);
      continue;
    }

    if (want === "solid") {
      if (have !== "solid") {
        void transitionToSolid(nodes, gen, PANEL_VIEW_MS);
      } else {
        forceSolidInstant(nodes);
      }
      continue;
    }

    // want blur — если уже blur с открытым cover, не трогаем (Наверх / i+2 с начала хода).
    if (i === blurIdx && have === "blur") {
      const cover = solidCoverOf(nodes.section);
      if (cover) {
        // Если cover ещё анимируется — пусть доиграет; иначе оставить 0.
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
 * Кольцевая «следующая» на последней: первая в слоте N как залитый квадрат
 * (solid), контент под cover уже decode — на «Наверх» только fade cover.
 */
export async function armHiddenRingNext(nodes: PanelNodesLike): Promise<void> {
  await prepareSharpUnderCover(nodes);
  // Виден только solid cover; контент уже в дереве под ним.
  const cover = solidCoverOf(nodes.section);
  if (cover) cover.style.opacity = "1";
  nodes.section.style.opacity = "1";
  nodes.section.style.visibility = "visible";
}

/**
 * Дооткрыть blur после посадки, только если ещё solid / под cover.
 * На последней — не blur, а скрытый ring-next (armHiddenRingNext).
 */
export async function revealNextBlurAfterLand(
  panels: Map<number, PanelNodesLike>,
  activeIndex: number,
  sectionCount: number,
  gen: number,
): Promise<void> {
  if (gen !== currentPanelViewGeneration()) return;

  if (activeIndex === sectionCount - 1 && sectionCount > 1) {
    const ringNext = panels.get(0);
    if (ringNext) await armHiddenRingNext(ringNext);
    return;
  }

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
 * Перед длинным ходом: только dest и dest+1 под непрозрачной заливкой.
 * Наверх: dest=sharp, dest+1=blur под cover; decode + кадр.
 * Бюджет ~2–3 кадра / ≤150 мс — дальше поворот стартует.
 */
export async function prepareLongJumpViews(
  panels: Map<number, PanelNodesLike>,
  destIndex: number,
  sectionCount: number,
  goingBack: boolean,
): Promise<void> {
  const deadline = performance.now() + 150;
  const nextBlur = destIndex + 1 < sectionCount ? destIndex + 1 : -1;

  // Старая blur (если не dest/dest+1) — быстро в solid до старта.
  for (const [i, nodes] of panels) {
    if (i === destIndex || i === nextBlur) continue;
    if (readPanelViewAttr(nodes.section) === "blur") {
      forceSolidInstant(nodes);
    }
  }

  const prep = async () => {
    const destNodes = panels.get(destIndex);
    if (destNodes) await prepareSharpUnderCover(destNodes);
    if (nextBlur >= 0) {
      const nextNodes = panels.get(nextBlur);
      if (nextNodes) await prepareBlurUnderCover(nextNodes);
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  };

  // Жёсткий потолок 150 мс: поворот стартует даже если decode не успел.
  await Promise.race([prep(), sleep(Math.max(0, deadline - performance.now()))]);

  // goingBack не влияет на набор панелей (только dest/dest+1) — параметр для API.
  void goingBack;
}
