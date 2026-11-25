export type ScrollBoxMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isScrollableClass: boolean;
};

export function panelCanConsumeWheel(box: ScrollBoxMetrics | null): boolean {
  if (!box || !box.isScrollableClass) return false;
  return box.scrollHeight > box.clientHeight + 2;
}

/** True when further wheel in `deltaY` direction should leave the panel. */
export function panelAtScrollEdge(box: ScrollBoxMetrics, deltaY: number): boolean {
  const maxScroll = Math.max(0, box.scrollHeight - box.clientHeight);
  const atTop = box.scrollTop <= 1;
  const atBottom = box.scrollTop >= maxScroll - 1;
  if (deltaY > 0) return atBottom;
  if (deltaY < 0) return atTop;
  return true;
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
