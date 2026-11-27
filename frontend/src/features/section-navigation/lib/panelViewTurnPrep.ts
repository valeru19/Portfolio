import { readPanelViewAttr } from "../model/panelView";

import { type LayerAnimHandle } from "./panelLayerAnimator";
import { nextFrame, veilOf, type PanelNodesLike } from "./panelViewDom";
import {
  currentPanelViewGeneration,
  fadeCoverToReveal,
  forceSolidInstant,
  prepareBlurUnderCover,
  prepareSharpUnderCover,
  transitionBlurToSharp,
  transitionSolidToSharp,
  transitionToSolid,
} from "./panelViewTransitions";
import { decodePanelImages, rememberPanelIntrinsicHeight } from "./panelReveal";

/** Батч 1–2 панели → flat (solid), без мгновенного force на всех сразу. */
export async function flattenPanelsBatched(
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
export function revealLongJumpLanding(
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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Ждём, пока dest перестанет быть live-blur (view≠blur или filter снят),
 * иначе fade cover у i+2 даёт два живых blur.
 * Готовим next под cover сразу; fade — после handoff dest, ещё во время хода.
 */
export async function waitDestVeilLow(
  destSection: HTMLElement | undefined,
  gen: number,
): Promise<void> {
  if (!destSection) return;
  const start = performance.now();
  while (performance.now() - start < 420) {
    if (gen !== currentPanelViewGeneration()) return;
    const view = destSection.getAttribute("data-panel-view");
    if (view !== "blur") return;
    const scroll = destSection.querySelector<HTMLElement>("[data-panel-scroll]");
    const filter = scroll ? getComputedStyle(scroll).filter : "none";
    if (!filter.includes("blur")) return;
    const veil = veilOf(destSection);
    if (veil) {
      const op = Number(getComputedStyle(veil).opacity);
      if (Number.isFinite(op) && op < 0.15) return;
    }
    await nextFrame();
  }
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
  // Параллельно и с бюджетом — не держать спин до двух nextFrame подряд.
  await Promise.race([
    Promise.all([
      dest ? prepareSharpUnderCover(dest) : Promise.resolve(),
      next ? prepareBlurUnderCover(next) : Promise.resolve(),
    ]),
    sleep(48),
  ]);
}

/**
 * Перед длинным ходом: только прогрев dest/dest+1 (decode),
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
