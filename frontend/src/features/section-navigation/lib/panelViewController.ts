/**
 * Публичный API видов панелей (sharp / blur / solid).
 * Реализация разбита: animator, DOM, transitions, turn, idle.
 */
export type { PanelNodesLike } from "./panelViewDom";
export type { TurnPlan } from "./panelViewTurn";
export type { LayerAnimHandle as AnimHandle } from "./panelLayerAnimator";

export { PANEL_VIEW_MS, PANEL_BLUR_HANDOFF_MS, PANEL_VIEW_EASE } from "./panelLayerAnimator";
export { PANEL_VIEW_ATTR } from "../model/panelView";

export { applyPanelViewsInstant } from "./panelViewIdle";

export {
  bumpPanelViewGeneration,
  currentPanelViewGeneration,
  resetPanelViewGenerationForTests,
  forceSolidInstant,
  prepareBlurUnderCover,
  prepareSharpUnderCover,
  transitionSolidToBlur,
  transitionToSolid,
  transitionToSolidContentFirst,
  transitionSolidToSharp,
  transitionSharpToBlur,
  transitionBlurToSharp,
  fadeCoverToReveal,
} from "./panelViewTransitions";

export {
  beginPanelViewTurn,
  settlePanelViewsAfterLand,
  revealNextBlurAfterLand,
  prepareLongJumpViews,
  armHiddenRingNext,
  armWrapAheadBlur,
} from "./panelViewTurn";
