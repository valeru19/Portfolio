import { PANEL_BLUR_PX } from "../model/constants";

/** Blur для панели, которая сейчас не текущая (состояние покоя). */
export function inactivePanelBlurPx(): number {
  return PANEL_BLUR_PX;
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

/** Пишем filter только при смене строки — без лишнего style thrash каждый кадр. */
export function paintPanelBlur(section: HTMLElement, blurPx: number): void {
  const next = blurPx <= 0.05 ? "none" : `blur(${blurPx.toFixed(2)}px)`;
  if (section.style.filter !== next) section.style.filter = next;
}

export function clearPanelBlur(section: HTMLElement): void {
  if (section.style.filter) section.style.filter = "";
}
