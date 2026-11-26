/** Вид панели в спирали: ровно один blur на всю сцену. */
export type PanelView = "sharp" | "blur" | "solid";

export const PANEL_VIEW_ATTR = "data-panel-view";

/**
 * Покой: active = sharp, active+1 = blur (если есть), остальные = solid.
 * На последней blur-панели нет (первая кольца спрятана в слоте N, не в idle-blur).
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

/** Слот раскладки: на последней первая уходит в слот N (впереди). */
export function layoutSlotForPanel(
  panelIndex: number,
  activeIndex: number,
  sectionCount: number,
): number {
  if (sectionCount > 1 && activeIndex === sectionCount - 1 && panelIndex === 0) {
    return sectionCount;
  }
  return panelIndex;
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
