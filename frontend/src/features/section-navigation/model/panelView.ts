/**
 * DOM-вид (`data-panel-view`). Совпадает с CSS.
 * Семантика шага 17: sharp=active, blur=next, solid=flat.
 */
export type PanelView = "sharp" | "blur" | "solid";

/** Роли покоя / хода (шаг 17 v2). */
export type PanelRole = "active" | "next" | "flat";

export const PANEL_VIEW_ATTR = "data-panel-view";

export function roleFromView(view: PanelView): PanelRole {
  if (view === "sharp") return "active";
  if (view === "blur") return "next";
  return "flat";
}

export function viewFromRole(role: PanelRole): PanelView {
  if (role === "active") return "sharp";
  if (role === "next") return "blur";
  return "solid";
}

/**
 * Покой: active = sharp, next (active+1) = blur (если есть), остальные = flat/solid.
 * На последней next нет (ring-next в слоте N — flat под cover, не live-blur).
 * Ровно один live-blur на сцену.
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

/** То же, что panelViewFor, в ролях шага 17. */
export function panelRoleFor(
  panelIndex: number,
  activeIndex: number,
  sectionCount: number,
): PanelRole {
  return roleFromView(panelViewFor(panelIndex, activeIndex, sectionCount));
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
