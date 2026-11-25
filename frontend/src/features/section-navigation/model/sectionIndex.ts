export function clampSectionIndex(index: number, sectionCount: number): number {
  if (sectionCount <= 0) return 0;
  return Math.min(sectionCount - 1, Math.max(0, index));
}

export function stepSectionIndex(
  currentIndex: number,
  direction: 1 | -1,
  sectionCount: number,
): number {
  return clampSectionIndex(currentIndex + direction, sectionCount);
}

export function formatSectionCounter(
  index: number,
  sectionCount: number,
): {
  current: string;
  total: string;
} {
  return {
    current: String(index + 1).padStart(2, "0"),
    total: String(sectionCount).padStart(2, "0"),
  };
}
