import { panelViewFor } from "../model/panelView";

import { decodePanelImages, rememberPanelIntrinsicHeight } from "./panelReveal";
import { bumpPanelViewGeneration } from "./panelViewTransitions";
import { applyViewInstant, type PanelNodesLike } from "./panelViewDom";

/** Мгновенно выставить вид (первая загрузка / reduced-motion / register). */
export function applyPanelViewsInstant(
  panels: Array<{ index: number; nodes: PanelNodesLike }>,
  activeIndex: number,
  sectionCount: number,
): void {
  bumpPanelViewGeneration();
  for (const { index, nodes } of panels) {
    const view = panelViewFor(index, activeIndex, sectionCount);
    applyViewInstant(nodes.section, view);
    if (view === "sharp" || view === "blur") {
      decodePanelImages(nodes.section);
      rememberPanelIntrinsicHeight(nodes.scroll);
    }
  }
}
