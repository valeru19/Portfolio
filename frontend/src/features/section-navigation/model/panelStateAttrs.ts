/** DOM state markers for spiral panels — paired with CSS Modules attribute selectors. */
export const PANEL_STATE_ATTR = {
  active: "data-active",
  far: "data-far",
  scrollable: "data-scrollable",
} as const;

export type PanelStateAttr = (typeof PANEL_STATE_ATTR)[keyof typeof PANEL_STATE_ATTR];

/** Static markers for global CSS (spin transitions), not toggled as panel state. */
export const SPIRAL_DOM_ATTR = {
  root: "data-spiral-root",
  section: "data-spiral-section",
  hud: "data-spiral-hud",
} as const;

export function setPanelStateAttr(element: Element, attr: PanelStateAttr, enabled: boolean): void {
  if (enabled) {
    element.setAttribute(attr, "");
  } else {
    element.removeAttribute(attr);
  }
}
