import type { PanelNodesLike } from "./panelViewDom";

export type TurnPlan = {
  fromIdx: number;
  destIdx: number;
  sectionCount: number;
  longJump: boolean;
  /** true = Наверх / шаг назад. */
  goingBack: boolean;
  durationSec: number;
  panels: Map<number, PanelNodesLike>;
  /**
   * Ход через круг: from→dest; dest+1 (вторая после wrap) —
   * blur под cover заранее, fade cover во время хода.
   */
  wrapsRing?: boolean;
};

export type TurnHandle = {
  gen: number;
  cancel: () => void;
  /**
   * Длинный ход: вызвать, когда осталось ≤90° — проявить dest (active) и next (blur).
   * До этого все панели flat.
   */
  onNearLand?: () => void;
};
