export type ScrollBoxMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  hasScrollableAttr: boolean;
};

const SCROLL_OVERFLOW_SLACK_PX = 2;
const SCROLL_EDGE_EPSILON_PX = 3;

export function panelCanConsumeWheel(box: ScrollBoxMetrics | null): boolean {
  if (!box || !box.hasScrollableAttr) return false;
  return box.scrollHeight > box.clientHeight + SCROLL_OVERFLOW_SLACK_PX;
}

/** True, если дальнейший wheel в сторону `deltaY` должен выйти из панели. */
export function panelAtScrollEdge(box: ScrollBoxMetrics, deltaY: number): boolean {
  const maxScroll = Math.max(0, box.scrollHeight - box.clientHeight);
  const atTop = box.scrollTop <= SCROLL_EDGE_EPSILON_PX;
  const atBottom = box.scrollTop >= maxScroll - SCROLL_EDGE_EPSILON_PX;
  if (deltaY > 0) return atBottom;
  if (deltaY < 0) return atTop;
  return true;
}

/**
 * Применяет wheel-дельту внутри панели. Нативный wheel ненадёжен, когда
 * scroll-box под CSS-трансформами спирали — поэтому крутим scrollTop сами.
 * `scrollFactor` < 1 смягчает крупные дельты тачпада.
 * Возвращает следующий scrollTop.
 */
export function nextScrollTopAfterWheel(
  box: ScrollBoxMetrics,
  deltaY: number,
  scrollFactor = 1,
): number {
  const maxScroll = Math.max(0, box.scrollHeight - box.clientHeight);
  return Math.min(maxScroll, Math.max(0, box.scrollTop + deltaY * scrollFactor));
}

/** Экспоненциальный догон к target; snap, когда уже достаточно близко. */
export function lerpScrollTop(current: number, target: number, alpha: number): number {
  if (alpha >= 1) return target;
  const next = current + (target - current) * alpha;
  return Math.abs(target - next) < 0.4 ? target : next;
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
