import { ASPECT, PANEL_BLUR_PX } from "../model/constants";
import { SPIRAL_DOM_ATTR, setBlurTurnAttr, type BlurTurnRole } from "../model/panelStateAttrs";

/**
 * Idle/spin blur через --panel-blur на section (наследуется blur-слоем).
 * Hover (ahead): CSS filter blur(0) с transition — переменную не трогаем.
 * Turn: WAAPI на blur-слое (не покадровая запись из GSAP onUpdate).
 */
export const PANEL_BLUR_VAR = "--panel-blur";
/** Длительность CSS-кроссфейда --panel-blur на from/dest (legacy fallback). */
export const BLUR_TURN_MS_VAR = "--blur-turn-ms";

/** Минимальный CSS-радиус, чтобы текст соседа оставался нечитаемым. */
export const MIN_PANEL_BLUR_PX = 8;

/** Blur для панели в покое без учёта scale (базовый потолок). */
export function inactivePanelBlurPx(): number {
  return PANEL_BLUR_PX;
}

/**
 * Эффективный экранный scale панели i при активной activeIdx:
 * ASPECT^(i - activeIdx). Позади (>1) CSS-blur режем, чтобы screen blur ≈ PANEL_BLUR_PX.
 */
export function effectivePanelScale(panelIndex: number, activeIndex: number): number {
  return Math.pow(ASPECT, panelIndex - activeIndex);
}

/**
 * CSS blur-радиус с учётом scale. Вид на экране у соседей ~PANEL_BLUR_PX,
 * у далёких «позади» не раздувается до сотен px.
 */
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

/** Idle blur панели относительно текущей (с учётом scale). */
export function idleBlurPxForPanel(panelIndex: number, activeIndex: number): number {
  if (panelIndex === activeIndex) return 0;
  return panelBlurPxForScale(effectivePanelScale(panelIndex, activeIndex));
}

/**
 * Кроссфейд blur на перевороте спирали.
 * progress 0 — ещё на from (резкая), 1 — приземлились на dest (резкая).
 */
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

/**
 * Округление blur для меньшего числа style-записей.
 */
export function quantizeBlurPx(blurPx: number, stepPx = 1): number {
  if (blurPx <= 0.05) return 0;
  const step = Math.max(1, stepPx);
  return Math.round(blurPx / step) * step;
}

function blurLayerOf(section: HTMLElement): HTMLElement | null {
  return section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.blurLayer}]`);
}

/** Пишет --panel-blur (не style.filter на section). */
export function paintPanelBlur(section: HTMLElement, blurPx: number, stepPx = 1): void {
  const q = quantizeBlurPx(blurPx, stepPx);
  const next = `${q}px`;
  if (section.style.getPropertyValue(PANEL_BLUR_VAR) !== next) {
    section.style.setProperty(PANEL_BLUR_VAR, next);
  }
  if (section.style.filter) section.style.filter = "";
  const layer = blurLayerOf(section);
  if (layer?.style.filter) layer.style.filter = "";
}

export function clearPanelBlur(section: HTMLElement): void {
  if (section.style.getPropertyValue(PANEL_BLUR_VAR)) {
    section.style.removeProperty(PANEL_BLUR_VAR);
  }
  if (section.style.filter) section.style.filter = "";
  const layer = blurLayerOf(section);
  if (layer?.style.filter) layer.style.filter = "";
  if (layer?.style.willChange) layer.style.willChange = "";
}

type BlurAnimHandle = {
  cancel: () => void;
};

const activeBlurAnims = new WeakMap<HTMLElement, Animation>();

function cancelLayerAnim(layer: HTMLElement): void {
  const prev = activeBlurAnims.get(layer);
  if (prev) {
    prev.cancel();
    activeBlurAnims.delete(layer);
  }
}

/**
 * WAAPI-кроссфейд filter на blur-слое from/dest.
 * Один запуск на ход (не onUpdate GSAP). will-change только на время анимации.
 */
export function beginBlurTurnWaapi(
  fromSection: HTMLElement | undefined,
  destSection: HTMLElement | undefined,
  durationSec: number,
  fromEndBlurPx: number,
  destStartBlurPx: number,
): BlurAnimHandle {
  const durationMs = Math.max(16, durationSec * 1000);
  const easing = "ease-in-out";
  const animations: Animation[] = [];

  const arm = (
    section: HTMLElement,
    role: BlurTurnRole,
    startPx: number,
    endPx: number,
  ): void => {
    const layer = blurLayerOf(section);
    if (!layer || typeof layer.animate !== "function") {
      // Fallback: мгновенный snap через переменную.
      setBlurTurnAttr(section, role);
      paintPanelBlur(section, endPx);
      return;
    }
    cancelLayerAnim(layer);
    setBlurTurnAttr(section, role);
    paintPanelBlur(section, startPx);
    layer.style.willChange = "filter";
    const anim = layer.animate(
      [{ filter: `blur(${quantizeBlurPx(startPx)}px)` }, { filter: `blur(${quantizeBlurPx(endPx)}px)` }],
      { duration: durationMs, easing, fill: "forwards" },
    );
    activeBlurAnims.set(layer, anim);
    animations.push(anim);
    void anim.finished
      .then(() => {
        paintPanelBlur(section, endPx);
        layer.style.filter = "";
        layer.style.willChange = "";
        activeBlurAnims.delete(layer);
      })
      .catch(() => {
        layer.style.willChange = "";
        activeBlurAnims.delete(layer);
      });
  };

  if (fromSection) arm(fromSection, "from", 0, fromEndBlurPx);
  if (destSection && destSection !== fromSection) {
    arm(destSection, "dest", destStartBlurPx, 0);
  }

  return {
    cancel: () => {
      for (const anim of animations) anim.cancel();
      if (fromSection) {
        const layer = blurLayerOf(fromSection);
        if (layer) {
          cancelLayerAnim(layer);
          layer.style.filter = "";
          layer.style.willChange = "";
        }
      }
      if (destSection) {
        const layer = blurLayerOf(destSection);
        if (layer) {
          cancelLayerAnim(layer);
          layer.style.filter = "";
          layer.style.willChange = "";
        }
      }
    },
  };
}

/**
 * Legacy CSS @property кроссфейд (fallback / тесты).
 * Предпочтительно beginBlurTurnWaapi.
 */
export function beginBlurTurnCrossfade(
  fromSection: HTMLElement | undefined,
  destSection: HTMLElement | undefined,
  durationSec: number,
  maxBlurPx = PANEL_BLUR_PX,
): void {
  const ms = `${Math.max(0.01, durationSec)}s`;

  const arm = (section: HTMLElement, role: BlurTurnRole, startPx: number, endPx: number) => {
    setBlurTurnAttr(section, null);
    paintPanelBlur(section, startPx);
    void section.offsetWidth;
    section.style.setProperty(BLUR_TURN_MS_VAR, ms);
    setBlurTurnAttr(section, role);
    paintPanelBlur(section, endPx);
  };

  if (fromSection) arm(fromSection, "from", 0, maxBlurPx);
  if (destSection && destSection !== fromSection) arm(destSection, "dest", maxBlurPx, 0);
}

/** Снять роль/длительность кроссфейда (перед markActive / kill). */
export function endBlurTurnCrossfade(...sections: Array<HTMLElement | undefined>): void {
  for (const section of sections) {
    if (!section) continue;
    setBlurTurnAttr(section, null);
    if (section.style.getPropertyValue(BLUR_TURN_MS_VAR)) {
      section.style.removeProperty(BLUR_TURN_MS_VAR);
    }
    const layer = blurLayerOf(section);
    if (layer) {
      cancelLayerAnim(layer);
      if (layer.style.filter) layer.style.filter = "";
      if (layer.style.willChange) layer.style.willChange = "";
    }
  }
}
