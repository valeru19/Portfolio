import { panelViewFor, readPanelViewAttr } from "../model/panelView";
import { prefersReducedMotion } from "../model/prefersReducedMotion";

import { PANEL_VIEW_MS, animateLayerOpacity } from "./panelLayerAnimator";
import { applyViewInstant, solidCoverOf, type PanelNodesLike } from "./panelViewDom";
import {
  currentPanelViewGeneration,
  fadeCoverToReveal,
  prepareBlurUnderCover,
  transitionSolidToSharp,
  transitionToSolid,
} from "./panelViewTransitions";
import { rememberPanelIntrinsicHeight } from "./panelReveal";

/**
 * После посадки: idle-виды.
 * Если dest+1 уже blur с cover=0 — ничего не меняем.
 */
export async function settlePanelViewsAfterLand(
  panels: Map<number, PanelNodesLike>,
  activeIndex: number,
  sectionCount: number,
): Promise<number> {
  // Не bump gen: иначе отменится fade cover i+2 / dest+1, начатый со стартом хода.
  const gen = currentPanelViewGeneration();
  const blurIdx = activeIndex + 1 < sectionCount ? activeIndex + 1 : -1;

  for (let i = 0; i < sectionCount; i += 1) {
    if (gen !== currentPanelViewGeneration()) return gen;
    const nodes = panels.get(i);
    if (!nodes) continue;
    const want = panelViewFor(i, activeIndex, sectionCount);
    const have = readPanelViewAttr(nodes.section);

    if (want === "sharp") {
      if (have !== "sharp") {
        void transitionSolidToSharp(nodes, gen, PANEL_VIEW_MS);
      }
      rememberPanelIntrinsicHeight(nodes.scroll);
      continue;
    }

    if (want === "solid") {
      if (have !== "solid") {
        void transitionToSolid(nodes, gen, PANEL_VIEW_MS);
      }
      continue;
    }

    // want blur — если уже blur с открытым cover, не трогаем.
    if (i === blurIdx && have === "blur") {
      const cover = solidCoverOf(nodes.section);
      if (cover) {
        const op = Number(getComputedStyle(cover).opacity);
        if (Number.isFinite(op) && op < 0.05) {
          cover.style.opacity = "0";
        }
      }
      rememberPanelIntrinsicHeight(nodes.scroll);
    }
  }

  return gen;
}

/**
 * Дооткрыть blur после посадки, только если ещё solid / под cover.
 * На последней next нет — только solid впереди (ghosts).
 */
export async function revealNextBlurAfterLand(
  panels: Map<number, PanelNodesLike>,
  activeIndex: number,
  sectionCount: number,
  gen: number,
): Promise<void> {
  if (gen !== currentPanelViewGeneration()) return;

  // На последней нет live-blur next.
  if (activeIndex >= sectionCount - 1) return;

  const blurIdx = activeIndex + 1;
  if (blurIdx >= sectionCount) return;
  const nodes = panels.get(blurIdx);
  if (!nodes) return;
  const have = readPanelViewAttr(nodes.section);
  if (have === "blur") {
    const cover = solidCoverOf(nodes.section);
    if (cover) {
      const op = Number(getComputedStyle(cover).opacity);
      if (Number.isFinite(op) && op > 0.05) {
        await animateLayerOpacity(cover, 0, PANEL_VIEW_MS);
      }
    }
    return;
  }
  if (prefersReducedMotion()) {
    applyViewInstant(nodes.section, "blur");
    return;
  }
  await prepareBlurUnderCover(nodes);
  if (gen !== currentPanelViewGeneration()) return;
  await fadeCoverToReveal(nodes.section, gen, PANEL_VIEW_MS);
}
