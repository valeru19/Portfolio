import { PANEL_BLUR_PX } from "../model/constants";

/** Idle / settled blur for a panel that is not current. */
export function inactivePanelBlurPx(): number {
  return PANEL_BLUR_PX;
}

/**
 * Crossfade blur for a spiral turn.
 * progress 0 = still on fromIndex (sharp), 1 = landed on dest (sharp).
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

/** Write filter only when the string changes — avoids style thrash every frame. */
export function paintPanelBlur(section: HTMLElement, blurPx: number): void {
  const next = blurPx <= 0.05 ? "none" : `blur(${blurPx.toFixed(2)}px)`;
  if (section.style.filter !== next) section.style.filter = next;
}

export function clearPanelBlur(section: HTMLElement): void {
  if (section.style.filter) section.style.filter = "";
}
