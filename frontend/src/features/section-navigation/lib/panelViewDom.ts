import { PANEL_BLUR_PX } from "../model/constants";
import { setPanelViewAttr, type PanelView } from "../model/panelView";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import { PANEL_BLUR_RADIUS_VAR } from "./panelBlur";
import { cancelLayerAnim } from "./panelLayerAnimator";

export type PanelNodesLike = {
  section: HTMLElement;
  scroll: HTMLElement;
};

export function solidCoverOf(section: HTMLElement): HTMLElement | null {
  return (
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.solidCover}]`) ??
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.frostFill}]`)
  );
}

export function veilOf(section: HTMLElement): HTMLElement | null {
  return (
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.blurVeil}]`) ??
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.blurLayer}]`)
  );
}

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Idle-переменные без инлайнового --panel-veil (иначе hover не работает).
 * Только радиус blur; opacity вуали — из CSS data-panel-view + --panel-veil по умолчанию.
 */
export function paintViewRadius(section: HTMLElement): void {
  section.style.setProperty(PANEL_BLUR_RADIUS_VAR, `${PANEL_BLUR_PX}px`);
  // Не пишем --panel-veil: иначе перебивает :hover { --panel-veil: 0 }.
  if (section.style.getPropertyValue("--panel-veil")) {
    section.style.removeProperty("--panel-veil");
  }
}

export function clearVeilInline(section: HTMLElement): void {
  const veil = veilOf(section);
  if (!veil) return;
  cancelLayerAnim(veil);
  veil.style.opacity = "";
  veil.style.willChange = "";
}

export function clearCoverInline(section: HTMLElement, opacity: number): void {
  const cover = solidCoverOf(section);
  if (!cover) return;
  cancelLayerAnim(cover);
  cover.style.opacity = String(opacity);
  cover.style.willChange = "";
}

export function applyViewInstant(section: HTMLElement, view: PanelView): void {
  const cover = solidCoverOf(section);
  const veil = veilOf(section);
  if (cover) {
    cancelLayerAnim(cover);
    cover.style.opacity = view === "solid" ? "1" : "0";
    cover.style.willChange = "";
  }
  if (veil) {
    cancelLayerAnim(veil);
    veil.style.opacity = "";
    veil.style.willChange = "";
  }
  setPanelViewAttr(section, view);
  paintViewRadius(section);
}
