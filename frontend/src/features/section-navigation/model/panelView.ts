/** Вид панели в спирали: ровно один blur на всю сцену. */
export type PanelView = "sharp" | "blur" | "solid";

export const PANEL_VIEW_ATTR = "data-panel-view";

/**
 * Покой: active = sharp, active+1 = blur (если есть), остальные = solid.
 * На последней секции blur-панели нет.
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
