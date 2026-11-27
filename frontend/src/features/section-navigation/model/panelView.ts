/** DOM-вид панели (`data-panel-view`), совпадает с CSS. */
export type PanelView = "sharp" | "blur" | "solid";

export const PANEL_VIEW_ATTR = "data-panel-view";

/**
 * Покой: active = sharp, next (active+1) = blur (если есть), остальные = solid.
 * На последней next нет — впереди только залитые квадраты, без live-blur.
 * Ровно один live-blur на сцену (или ноль на последней).
 */
export function panelViewFor(
  panelIndex: number,
  activeIndex: number,
  sectionCount: number,
): PanelView {
  if (panelIndex === activeIndex) return "sharp";
  if (panelIndex === activeIndex + 1 && activeIndex + 1 < sectionCount) return "blur";
  return "solid";
}

export function setPanelViewAttr(element: Element, view: PanelView): void {
  if (element.getAttribute(PANEL_VIEW_ATTR) === view) return;
  element.setAttribute(PANEL_VIEW_ATTR, view);
}

export function readPanelViewAttr(element: Element): PanelView | null {
  const v = element.getAttribute(PANEL_VIEW_ATTR);
  if (v === "sharp" || v === "blur" || v === "solid") return v;
  return null;
}
