export type ScrollBoxMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isScrollableClass: boolean;
};

const SCROLL_OVERFLOW_SLACK_PX = 2;
const SCROLL_EDGE_EPSILON_PX = 3;

export function panelCanConsumeWheel(box: ScrollBoxMetrics | null): boolean {
  if (!box || !box.isScrollableClass) return false;
  return box.scrollHeight > box.clientHeight + SCROLL_OVERFLOW_SLACK_PX;
}

/** True when further wheel in `deltaY` direction should leave the panel. */
export function panelAtScrollEdge(box: ScrollBoxMetrics, deltaY: number): boolean {
  const maxScroll = Math.max(0, box.scrollHeight - box.clientHeight);
  const atTop = box.scrollTop <= SCROLL_EDGE_EPSILON_PX;
  const atBottom = box.scrollTop >= maxScroll - SCROLL_EDGE_EPSILON_PX;
  if (deltaY > 0) return atBottom;
  if (deltaY < 0) return atTop;
  return true;
}

/**
 * Apply wheel delta inside a panel. Native wheel scrolling is unreliable when the
 * scroll box sits under CSS transforms (spiral rotate/scale), so we drive scrollTop.
 * Returns the next scrollTop.
 */
export function nextScrollTopAfterWheel(box: ScrollBoxMetrics, deltaY: number): number {
  const maxScroll = Math.max(0, box.scrollHeight - box.clientHeight);
  return Math.min(maxScroll, Math.max(0, box.scrollTop + deltaY));
}

export function normalizeWheelDeltaY(
  deltaY: number,
  deltaMode: number,
  viewportHeight: number,
): number {
  if (deltaMode === 1) return deltaY * 16;
  if (deltaMode === 2) return deltaY * viewportHeight;
  return deltaY;
}
