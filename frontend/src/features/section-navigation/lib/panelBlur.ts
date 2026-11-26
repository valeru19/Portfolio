import { ASPECT, PANEL_BLUR_PX } from "../model/constants";
import { SPIRAL_DOM_ATTR, setBlurTurnAttr, type BlurTurnRole } from "../model/panelStateAttrs";

/**
 * Blur через opacity-вуаль (backdrop-filter радиус статичен).
 * Turn: WAAPI opacity на from/dest — не меняем filter mid-spin.
 */
export const PANEL_VEIL_VAR = "--panel-veil";
export const PANEL_BLUR_RADIUS_VAR = "--panel-blur-radius";
/** @deprecated alias для тестов/старых импортов — пишем радиус, не filter. */
export const PANEL_BLUR_VAR = PANEL_BLUR_RADIUS_VAR;
export const BLUR_TURN_MS_VAR = "--blur-turn-ms";

/** Минимальный радиус backdrop у видимых соседей. */
export const MIN_PANEL_BLUR_PX = 10;

/**
 * Ниже этого экранного scale — data-blur-lite (без backdrop-filter).
 * Соседи (~0.62) остаются с backdrop; дальше — дешёвый tint (текст всё равно нечитаем).
 */
export const BLUR_LITE_SCALE = 0.5;

export function inactivePanelBlurPx(): number {
  return PANEL_BLUR_PX;
}

export function effectivePanelScale(panelIndex: number, activeIndex: number): number {
  return Math.pow(ASPECT, panelIndex - activeIndex);
}

export function panelBlurPxForScale(
  effectiveScale: number,
  maxBlurPx = PANEL_BLUR_PX,
  minBlurPx = MIN_PANEL_BLUR_PX,
): number {
  const scale = Math.max(0.05, effectiveScale);
  const capped = Math.min(maxBlurPx, maxBlurPx / scale);
  if (capped <= 0.05) return 0;
  return Math.max(minBlurPx, quantizeBlurPx(capped));
}

/** Idle: 0 = резкая (active), 1 = под вуалью. */
export function idleVeilAmount(panelIndex: number, activeIndex: number): number {
  return panelIndex === activeIndex ? 0 : 1;
}

/** @deprecated для старых тестов progress→px; veil использует amount 0..1. */
export function idleBlurPxForPanel(panelIndex: number, activeIndex: number): number {
  if (panelIndex === activeIndex) return 0;
  return panelBlurPxForScale(effectivePanelScale(panelIndex, activeIndex));
}

export function blurPxForTurnProgress(
  role: "from" | "dest" | "other",
  progress: number,
  maxBlurPx = PANEL_BLUR_PX,
): number {
  const t = Math.min(1, Math.max(0, progress));
  if (role === "from") return t * maxBlurPx;
  if (role === "dest") return (1 - t) * maxBlurPx;
  return maxBlurPx;
}

/** Veil amount mid-turn: from 0→1, dest 1→0, other 1. */
export function veilAmountForTurnProgress(
  role: "from" | "dest" | "other",
  progress: number,
): number {
  const t = Math.min(1, Math.max(0, progress));
  if (role === "from") return t;
  if (role === "dest") return 1 - t;
  return 1;
}

export function quantizeBlurPx(blurPx: number, stepPx = 1): number {
  if (blurPx <= 0.05) return 0;
  const step = Math.max(1, stepPx);
  return Math.round(blurPx / step) * step;
}

function veilOf(section: HTMLElement): HTMLElement | null {
  return (
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.blurVeil}]`) ??
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.blurLayer}]`)
  );
}

/** Пишет opacity вуали 0..1 и статичный радиус backdrop. */
export function paintPanelVeil(
  section: HTMLElement,
  veilAmount: number,
  blurRadiusPx = PANEL_BLUR_PX,
): void {
  const amount = Math.min(1, Math.max(0, veilAmount));
  const next = String(Number(amount.toFixed(3)));
  if (section.style.getPropertyValue(PANEL_VEIL_VAR) !== next) {
    section.style.setProperty(PANEL_VEIL_VAR, next);
  }
  const radius = `${quantizeBlurPx(blurRadiusPx)}px`;
  if (section.style.getPropertyValue(PANEL_BLUR_RADIUS_VAR) !== radius) {
    section.style.setProperty(PANEL_BLUR_RADIUS_VAR, radius);
  }
}

/**
 * Совместимость: blurPx>0 → вуаль 1, blurPx=0 → вуаль 0.
 * Радиус пишется отдельно через paintPanelVeil / markActive.
 */
export function paintPanelBlur(section: HTMLElement, blurPx: number, stepPx = 1): void {
  const q = quantizeBlurPx(blurPx, stepPx);
  paintPanelVeil(section, q <= 0 ? 0 : 1, q > 0 ? q : PANEL_BLUR_PX);
}

export function clearPanelBlur(section: HTMLElement): void {
  if (section.style.getPropertyValue(PANEL_VEIL_VAR)) {
    section.style.removeProperty(PANEL_VEIL_VAR);
  }
  if (section.style.getPropertyValue(PANEL_BLUR_RADIUS_VAR)) {
    section.style.removeProperty(PANEL_BLUR_RADIUS_VAR);
  }
  const veil = veilOf(section);
  if (veil?.style.opacity) veil.style.opacity = "";
  if (veil?.style.willChange) veil.style.willChange = "";
}

const activeVeilAnims = new WeakMap<HTMLElement, Animation>();

function cancelVeilAnim(veil: HTMLElement): void {
  const prev = activeVeilAnims.get(veil);
  if (prev) {
    prev.cancel();
    activeVeilAnims.delete(veil);
  }
}

type BlurAnimHandle = { cancel: () => void };

/**
 * WAAPI opacity на вуали from/dest (композитор).
 * Радиус backdrop не трогаем. will-change только на время хода.
 */
export function beginBlurTurnWaapi(
  fromSection: HTMLElement | undefined,
  destSection: HTMLElement | undefined,
  durationSec: number,
): BlurAnimHandle {
  const durationMs = Math.max(16, durationSec * 1000);
  const easing = "ease-in-out";
  const animations: Animation[] = [];

  const arm = (section: HTMLElement, role: BlurTurnRole, start: number, end: number): void => {
    const veil = veilOf(section);
    setBlurTurnAttr(section, role);
    paintPanelVeil(section, start);
    if (!veil || typeof veil.animate !== "function") {
      paintPanelVeil(section, end);
      return;
    }
    cancelVeilAnim(veil);
    veil.style.willChange = "opacity";
    const anim = veil.animate([{ opacity: start }, { opacity: end }], {
      duration: durationMs,
      easing,
      fill: "forwards",
    });
    activeVeilAnims.set(veil, anim);
    animations.push(anim);
    void anim.finished
      .then(() => {
        paintPanelVeil(section, end);
        veil.style.opacity = "";
        veil.style.willChange = "";
        activeVeilAnims.delete(veil);
      })
      .catch(() => {
        veil.style.willChange = "";
        activeVeilAnims.delete(veil);
      });
  };

  if (fromSection) arm(fromSection, "from", 0, 1);
  if (destSection && destSection !== fromSection) arm(destSection, "dest", 1, 0);

  return {
    cancel: () => {
      for (const anim of animations) anim.cancel();
      for (const section of [fromSection, destSection]) {
        if (!section) continue;
        const veil = veilOf(section);
        if (!veil) continue;
        cancelVeilAnim(veil);
        veil.style.opacity = "";
        veil.style.willChange = "";
      }
    },
  };
}

/** Legacy CSS var crossfade — теперь тоже через veil amount. */
export function beginBlurTurnCrossfade(
  fromSection: HTMLElement | undefined,
  destSection: HTMLElement | undefined,
  durationSec: number,
  maxBlurPx = PANEL_BLUR_PX,
): void {
  void maxBlurPx;
  const ms = `${Math.max(0.01, durationSec)}s`;
  const arm = (section: HTMLElement, role: BlurTurnRole, start: number, end: number) => {
    setBlurTurnAttr(section, null);
    paintPanelVeil(section, start);
    void section.offsetWidth;
    section.style.setProperty(BLUR_TURN_MS_VAR, ms);
    setBlurTurnAttr(section, role);
    paintPanelVeil(section, end);
  };
  if (fromSection) arm(fromSection, "from", 0, 1);
  if (destSection && destSection !== fromSection) arm(destSection, "dest", 1, 0);
}

export function endBlurTurnCrossfade(...sections: Array<HTMLElement | undefined>): void {
  for (const section of sections) {
    if (!section) continue;
    setBlurTurnAttr(section, null);
    if (section.style.getPropertyValue(BLUR_TURN_MS_VAR)) {
      section.style.removeProperty(BLUR_TURN_MS_VAR);
    }
    const veil = veilOf(section);
    if (veil) {
      cancelVeilAnim(veil);
      if (veil.style.opacity) veil.style.opacity = "";
      if (veil.style.willChange) veil.style.willChange = "";
    }
  }
}

/** @deprecated шаг 18: blur только у active+1; lite больше не используется. */
export function paintBlurLiteFlag(section: HTMLElement, lite: boolean): void {
  void section;
  void lite;
}
