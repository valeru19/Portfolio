import { PANEL_BLUR_PX, SPIRAL_FLIP_DURATION_MS } from "../model/constants";
import {
  PANEL_VIEW_ATTR,
  panelViewFor,
  readPanelViewAttr,
  setPanelViewAttr,
  type PanelView,
} from "../model/panelView";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";
import { prefersReducedMotion } from "../model/prefersReducedMotion";

import { PANEL_BLUR_RADIUS_VAR, PANEL_VEIL_VAR } from "./panelBlur";
import { decodePanelImages, PANEL_REVEAL_MS, rememberPanelIntrinsicHeight } from "./panelReveal";

export type PanelNodesLike = {
  section: HTMLElement;
  scroll: HTMLElement;
};

type CoverAnim = { cancel: () => void };

const coverAnims = new WeakMap<HTMLElement, Animation>();
let viewGen = 0;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function solidCoverOf(section: HTMLElement): HTMLElement | null {
  return (
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.solidCover}]`) ??
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.frostFill}]`)
  );
}

function veilOf(section: HTMLElement): HTMLElement | null {
  return (
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.blurVeil}]`) ??
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.blurLayer}]`)
  );
}

function readCoverOpacity(cover: HTMLElement): number {
  const inline = cover.style.opacity;
  if (inline !== "") {
    const n = Number(inline);
    if (Number.isFinite(n)) return n;
  }
  const computed = Number(getComputedStyle(cover).opacity);
  return Number.isFinite(computed) ? computed : 0;
}

function cancelCoverAnim(cover: HTMLElement): void {
  const prev = coverAnims.get(cover);
  if (prev) {
    prev.cancel();
    coverAnims.delete(cover);
  }
}

function animateCoverOpacity(
  cover: HTMLElement,
  from: number,
  to: number,
  durationMs: number,
): Promise<void> {
  cancelCoverAnim(cover);
  if (prefersReducedMotion() || typeof cover.animate !== "function") {
    cover.style.opacity = String(to);
    return Promise.resolve();
  }
  cover.style.willChange = "opacity";
  const anim = cover.animate([{ opacity: from }, { opacity: to }], {
    duration: Math.max(16, durationMs),
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
  });
  coverAnims.set(cover, anim);
  return anim.finished
    .then(() => {
      cover.style.opacity = String(to);
      cover.style.willChange = "";
      coverAnims.delete(cover);
      try {
        anim.cancel();
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      cover.style.willChange = "";
      coverAnims.delete(cover);
    });
}

function paintIdleVeilVars(section: HTMLElement, view: PanelView): void {
  if (view === "sharp") {
    section.style.setProperty(PANEL_VEIL_VAR, "0");
  } else if (view === "blur") {
    section.style.setProperty(PANEL_VEIL_VAR, "1");
    section.style.setProperty(PANEL_BLUR_RADIUS_VAR, `${PANEL_BLUR_PX}px`);
  } else {
    section.style.removeProperty(PANEL_VEIL_VAR);
    section.style.setProperty(PANEL_BLUR_RADIUS_VAR, `${PANEL_BLUR_PX}px`);
  }
}

/** Мгновенно выставить вид (первая загрузка / reduced-motion / доступный режим сброс). */
export function applyPanelViewsInstant(
  panels: Array<{ index: number; nodes: PanelNodesLike }>,
  activeIndex: number,
  sectionCount: number,
): void {
  viewGen += 1;
  for (const { index, nodes } of panels) {
    const view = panelViewFor(index, activeIndex, sectionCount);
    const cover = solidCoverOf(nodes.section);
    cancelCoverAnim(cover ?? nodes.section);
    if (cover) {
      cover.style.opacity = view === "solid" ? "1" : "0";
      cover.style.willChange = "";
    }
    setPanelViewAttr(nodes.section, view);
    paintIdleVeilVars(nodes.section, view);
    if (view === "sharp") rememberPanelIntrinsicHeight(nodes.scroll);
  }
}

/**
 * solid → blur: строго по кадрам (4.1).
 * Заливка непрозрачна → контент → decode → вуаль → fade заливка 1→0.
 */
export async function transitionSolidToBlur(
  nodes: PanelNodesLike,
  gen: number,
  durationMs = PANEL_REVEAL_MS,
): Promise<void> {
  if (gen !== viewGen) return;
  const { section, scroll } = nodes;
  const cover = solidCoverOf(section);
  if (!cover) {
    setPanelViewAttr(section, "blur");
    paintIdleVeilVars(section, "blur");
    return;
  }

  const startOp = Math.max(readCoverOpacity(cover), 0.99);
  cover.style.opacity = String(startOp);
  // Под заливкой включаем контент+вуаль (view=blur), заливка пока держит кадр.
  setPanelViewAttr(section, "blur");
  paintIdleVeilVars(section, "blur");

  await nextFrame();
  if (gen !== viewGen) return;
  decodePanelImages(section);
  rememberPanelIntrinsicHeight(scroll);

  await nextFrame();
  if (gen !== viewGen) return;

  if (prefersReducedMotion()) {
    cover.style.opacity = "0";
    return;
  }
  await animateCoverOpacity(cover, startOp, 0, durationMs);
}

/** blur|sharp → solid: сначала заливка 0→1, затем view=solid. */
export async function transitionToSolid(
  nodes: PanelNodesLike,
  gen: number,
  durationMs: number,
): Promise<void> {
  if (gen !== viewGen) return;
  const { section } = nodes;
  const cover = solidCoverOf(section);
  const current = readPanelViewAttr(section) ?? "solid";
  if (current === "solid" && cover && readCoverOpacity(cover) >= 0.99) return;

  if (!cover) {
    setPanelViewAttr(section, "solid");
    paintIdleVeilVars(section, "solid");
    return;
  }

  const from = readCoverOpacity(cover);
  await animateCoverOpacity(cover, from, 1, durationMs);
  if (gen !== viewGen) return;
  setPanelViewAttr(section, "solid");
  paintIdleVeilVars(section, "solid");
}

/** solid → sharp во время хода: контент под заливкой, затем fade. */
export async function transitionSolidToSharp(
  nodes: PanelNodesLike,
  gen: number,
  durationMs: number,
): Promise<void> {
  if (gen !== viewGen) return;
  const { section, scroll } = nodes;
  const cover = solidCoverOf(section);
  if (!cover) {
    setPanelViewAttr(section, "sharp");
    paintIdleVeilVars(section, "sharp");
    return;
  }

  const startOp = Math.max(readCoverOpacity(cover), 0.99);
  cover.style.opacity = String(startOp);
  setPanelViewAttr(section, "sharp");
  paintIdleVeilVars(section, "sharp");
  await nextFrame();
  if (gen !== viewGen) return;
  decodePanelImages(section);
  rememberPanelIntrinsicHeight(scroll);
  await nextFrame();
  if (gen !== viewGen) return;
  await animateCoverOpacity(cover, startOp, 0, durationMs);
}

/** blur → sharp: вуаль opacity 1→0 (WAAPI), без смены радиуса. */
export function transitionBlurToSharp(section: HTMLElement, durationMs: number): CoverAnim {
  const veil = veilOf(section);
  setPanelViewAttr(section, "sharp");
  paintIdleVeilVars(section, "sharp");
  if (!veil || typeof veil.animate !== "function" || prefersReducedMotion()) {
    return { cancel: () => undefined };
  }
  const start = Number(getComputedStyle(veil).opacity);
  const from = Number.isFinite(start) ? start : 1;
  veil.style.willChange = "opacity";
  const anim = veil.animate([{ opacity: from }, { opacity: 0 }], {
    duration: Math.max(16, durationMs),
    easing: "ease-in-out",
    fill: "forwards",
  });
  void anim.finished
    .then(() => {
      veil.style.opacity = "";
      veil.style.willChange = "";
      try {
        anim.cancel();
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      veil.style.willChange = "";
    });
  return {
    cancel: () => {
      anim.cancel();
      veil.style.opacity = "";
      veil.style.willChange = "";
    },
  };
}

export type TurnPlan = {
  fromIdx: number;
  destIdx: number;
  sectionCount: number;
  longJump: boolean;
  durationSec: number;
  panels: Map<number, PanelNodesLike>;
};

/**
 * Старт хода: mid → solid; from/dest кроссфейды по правилам 4.3–4.5.
 * Возвращает handle отмены + generation.
 */
export function beginPanelViewTurn(plan: TurnPlan): { gen: number; cancel: () => void } {
  const gen = ++viewGen;
  const durationMs = Math.max(16, plan.durationSec * 1000);
  const earlySolidMs = Math.min(200, Math.max(150, durationMs * 0.12));
  const handles: CoverAnim[] = [];
  const { fromIdx, destIdx, sectionCount, longJump, panels } = plan;

  const oldBlurIdx = fromIdx + 1 < sectionCount ? fromIdx + 1 : -1;

  for (let i = 0; i < sectionCount; i += 1) {
    const nodes = panels.get(i);
    if (!nodes) continue;
    const isFrom = i === fromIdx;
    const isDest = i === destIdx;

    if (longJump) {
      if (!isFrom && !isDest) {
        // Весь ход solid; старая blur уходит за 150–200 мс.
        if (i === oldBlurIdx && oldBlurIdx !== destIdx) {
          void transitionToSolid(nodes, gen, earlySolidMs);
        } else {
          const cover = solidCoverOf(nodes.section);
          if (cover) {
            cancelCoverAnim(cover);
            cover.style.opacity = "1";
          }
          setPanelViewAttr(nodes.section, "solid");
          paintIdleVeilVars(nodes.section, "solid");
        }
      }
    } else {
      // Одношаговый: i+2 и дальние остаются/становятся solid без анимации blur.
      if (!isFrom && !isDest) {
        if (i === oldBlurIdx && destIdx === fromIdx - 1) {
          // Шаг назад: бывшая blur → solid во время хода.
          void transitionToSolid(nodes, gen, durationMs);
        } else if (readPanelViewAttr(nodes.section) !== "solid") {
          const cover = solidCoverOf(nodes.section);
          if (cover) {
            cancelCoverAnim(cover);
            cover.style.opacity = "1";
          }
          setPanelViewAttr(nodes.section, "solid");
          paintIdleVeilVars(nodes.section, "solid");
        }
      }
    }
  }

  const fromNodes = panels.get(fromIdx);
  const destNodes = panels.get(destIdx);

  if (fromNodes && fromIdx !== destIdx) {
    // from: sharp → solid (или blur→solid на edge cases)
    void transitionToSolid(fromNodes, gen, durationMs);
  }

  if (destNodes && fromIdx !== destIdx) {
    const destWas = readPanelViewAttr(destNodes.section);
    if (destWas === "blur" || (!longJump && destIdx === fromIdx + 1)) {
      handles.push(transitionBlurToSharp(destNodes.section, durationMs));
    } else {
      void transitionSolidToSharp(destNodes, gen, durationMs);
    }
  }

  return {
    gen,
    cancel: () => {
      viewGen += 1;
      for (const h of handles) h.cancel();
    },
  };
}

/** После посадки: idle-виды; только dest+1 делает solid→blur. */
export async function settlePanelViewsAfterLand(
  panels: Map<number, PanelNodesLike>,
  activeIndex: number,
  sectionCount: number,
): Promise<number> {
  const gen = ++viewGen;
  const blurIdx = activeIndex + 1 < sectionCount ? activeIndex + 1 : -1;

  for (let i = 0; i < sectionCount; i += 1) {
    if (gen !== viewGen) return gen;
    const nodes = panels.get(i);
    if (!nodes) continue;
    const want = panelViewFor(i, activeIndex, sectionCount);
    const have = readPanelViewAttr(nodes.section);

    if (want === "sharp") {
      const cover = solidCoverOf(nodes.section);
      if (cover) {
        cancelCoverAnim(cover);
        cover.style.opacity = "0";
      }
      setPanelViewAttr(nodes.section, "sharp");
      paintIdleVeilVars(nodes.section, "sharp");
      rememberPanelIntrinsicHeight(nodes.scroll);
      continue;
    }

    if (want === "solid") {
      if (have !== "solid") {
        void transitionToSolid(nodes, gen, Math.min(PANEL_REVEAL_MS, SPIRAL_FLIP_DURATION_MS));
      } else {
        const cover = solidCoverOf(nodes.section);
        if (cover && readCoverOpacity(cover) < 0.99) cover.style.opacity = "1";
        setPanelViewAttr(nodes.section, "solid");
        paintIdleVeilVars(nodes.section, "solid");
      }
      continue;
    }

    // want blur — только active+1, плавно из solid
    if (i === blurIdx) {
      if (have === "blur") {
        const cover = solidCoverOf(nodes.section);
        if (cover) cover.style.opacity = "0";
        paintIdleVeilVars(nodes.section, "blur");
      } else {
        // Не в кадре посадки: вызвать снаружи после rAF; здесь готовим solid cover.
        const cover = solidCoverOf(nodes.section);
        if (cover) {
          cancelCoverAnim(cover);
          cover.style.opacity = "1";
        }
        setPanelViewAttr(nodes.section, "solid");
        paintIdleVeilVars(nodes.section, "solid");
      }
    }
  }

  return gen;
}

/** Запуск solid→blur для active+1 после посадки (не в кадре land). */
export async function revealNextBlurAfterLand(
  panels: Map<number, PanelNodesLike>,
  activeIndex: number,
  sectionCount: number,
  gen: number,
): Promise<void> {
  if (gen !== viewGen) return;
  const blurIdx = activeIndex + 1;
  if (blurIdx >= sectionCount) return;
  const nodes = panels.get(blurIdx);
  if (!nodes) return;
  await transitionSolidToBlur(nodes, gen, PANEL_REVEAL_MS);
}

export function bumpPanelViewGeneration(): number {
  viewGen += 1;
  return viewGen;
}

export function currentPanelViewGeneration(): number {
  return viewGen;
}

/** Для тестов: сброс generation. */
export function resetPanelViewGenerationForTests(): void {
  viewGen = 0;
}

export { PANEL_VIEW_ATTR };
