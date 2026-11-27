import { readPanelViewAttr } from "../model/panelView";

import { PANEL_BLUR_HANDOFF_MS, PANEL_VIEW_MS, type LayerAnimHandle } from "./panelLayerAnimator";
import { flattenPanelsBatched, revealLongJumpLanding, waitDestVeilLow } from "./panelViewTurnPrep";
import type { TurnHandle, TurnPlan } from "./panelViewTurnTypes";
import {
  bumpPanelViewGeneration,
  currentPanelViewGeneration,
  fadeCoverToReveal,
  forceSolidInstant,
  prepareBlurUnderCover,
  transitionBlurToSharp,
  transitionSharpToBlur,
  transitionSolidToSharp,
  transitionToSolid,
} from "./panelViewTransitions";

export type { TurnPlan, TurnHandle } from "./panelViewTurnTypes";
export { settlePanelViewsAfterLand, revealNextBlurAfterLand } from "./panelViewSettle";
export { prepareLongJumpViews, prepareRingWrapViews } from "./panelViewTurnPrep";

/**
 * Старт хода по спецификации видов панелей.
 * Вперёд i+2: готовка под cover сразу; fade cover во время хода (не после посадки).
 */
export function beginPanelViewTurn(plan: TurnPlan): TurnHandle {
  const gen = bumpPanelViewGeneration();
  const durationMs = Math.max(PANEL_VIEW_MS, plan.durationSec * 1000);
  const viewMs = Math.min(PANEL_VIEW_MS, durationMs);
  const handles: LayerAnimHandle[] = [];
  const { fromIdx, destIdx, sectionCount, longJump, goingBack, panels, wrapsRing } = plan;

  const oldBlurIdx = fromIdx + 1 < sectionCount ? fromIdx + 1 : -1;
  const nextBlurIdx = destIdx + 1 < sectionCount ? destIdx + 1 : -1;

  const fromNodes = panels.get(fromIdx);
  const destNodes = panels.get(destIdx);

  const cancel = () => {
    bumpPanelViewGeneration();
    for (const h of handles) h.cancel();
  };

  // Wrap через круг: dest/next уже под cover (prepareRingWrapViews); остальные → flat.
  if (wrapsRing) {
    const prepMs = Math.min(PANEL_VIEW_MS, Math.max(150, Math.round(durationMs * 0.12)));
    const skip = new Set<number>([destIdx]);
    if (nextBlurIdx >= 0) skip.add(nextBlurIdx);
    void flattenPanelsBatched(panels, gen, prepMs, skip);
    return {
      gen,
      cancel,
      onNearLand: () => {
        revealLongJumpLanding(panels, destIdx, nextBlurIdx, gen, viewMs, handles);
      },
    };
  }

  // Длинный ход без wrap: все flat; dest+next в onNearLand.
  if (longJump) {
    const prepMs = Math.min(PANEL_VIEW_MS, Math.max(150, Math.round(durationMs * 0.12)));
    void flattenPanelsBatched(panels, gen, prepMs);
    return {
      gen,
      cancel,
      onNearLand: () => {
        revealLongJumpLanding(panels, destIdx, nextBlurIdx, gen, viewMs, handles);
      },
    };
  }

  // Один шаг назад.
  if (goingBack) {
    const run = async () => {
      // Старая blur (i+1) сначала в solid 120–150 мс, потом blur на from.
      if (oldBlurIdx >= 0 && oldBlurIdx !== destIdx) {
        const oldBlur = panels.get(oldBlurIdx);
        if (oldBlur) {
          await transitionToSolid(oldBlur, gen, PANEL_BLUR_HANDOFF_MS);
        }
      }
      if (gen !== currentPanelViewGeneration()) return;

      for (let i = 0; i < sectionCount; i += 1) {
        const nodes = panels.get(i);
        if (!nodes) continue;
        if (i === fromIdx || i === destIdx) continue;
        if (readPanelViewAttr(nodes.section) !== "solid") forceSolidInstant(nodes);
      }

      // from: sharp → blur напрямую (cover = 0).
      if (fromNodes && fromIdx !== destIdx) {
        handles.push(transitionSharpToBlur(fromNodes.section, durationMs));
      }
      // dest: solid → sharp во время хода.
      if (destNodes && fromIdx !== destIdx) {
        void transitionSolidToSharp(destNodes, gen, durationMs);
      }
    };
    void run();
    return { gen, cancel };
  }

  // Один шаг вперёд.
  {
    for (let i = 0; i < sectionCount; i += 1) {
      const nodes = panels.get(i);
      if (!nodes) continue;
      if (i === fromIdx || i === destIdx || i === nextBlurIdx) continue;
      if (readPanelViewAttr(nodes.section) !== "solid") forceSolidInstant(nodes);
    }

    // i (from): sharp → solid во время хода.
    if (fromNodes && fromIdx !== destIdx) {
      void transitionToSolid(fromNodes, gen, durationMs);
    }
    // i+1 (dest): blur → sharp.
    if (destNodes && fromIdx !== destIdx) {
      handles.push(transitionBlurToSharp(destNodes.section, durationMs));
    }
    // i+2: готовим под cover сразу; fade после handoff dest (≤1 blur), ещё во время хода.
    if (nextBlurIdx >= 0) {
      const nextNodes = panels.get(nextBlurIdx);
      if (nextNodes) {
        void (async () => {
          await prepareBlurUnderCover(nextNodes);
          if (gen !== currentPanelViewGeneration()) return;
          await waitDestVeilLow(destNodes?.section, gen);
          if (gen !== currentPanelViewGeneration()) return;
          await fadeCoverToReveal(nextNodes.section, gen, viewMs);
        })();
      }
    }
  }

  return { gen, cancel };
}
