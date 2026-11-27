/**
 * Кольцевая навигация: далёкий ход «назад» = вперёд через конец круга.
 * Чистая логика без React/DOM.
 */

/**
 * Макс. шагов обычного reverse. Дальше — wrap вперёд через край круга.
 * «Наверх» с последней (target=0) при N>4 всегда wrap (distance = N-1 > 3).
 */
export const RING_BACK_THRESHOLD = 3;

export type MoveDirection = "forward" | "back" | "noop";

export type MovePlan = {
  direction: MoveDirection;
  /** Число шагов спирали (≥0). */
  steps: number;
  /** true = вперёд через конец круга на target следующего витка. */
  wrapsRing: boolean;
  targetSection: number;
};

/** Секция на виртуальном индексе. */
export function sectionFromV(v: number, sectionCount: number): number {
  if (sectionCount <= 0) return 0;
  const mod = ((v % sectionCount) + sectionCount) % sectionCount;
  return mod;
}

function clampSection(section: number, sectionCount: number): number {
  if (sectionCount <= 0) return 0;
  return Math.min(sectionCount - 1, Math.max(0, Math.trunc(section)));
}

/**
 * План перехода с виртуального индекса на целевую секцию [0, N).
 * currentV монотонен; секция = currentV mod N.
 */
export function planMove(
  currentV: number,
  targetSection: number,
  sectionCount: number,
  backThreshold: number = RING_BACK_THRESHOLD,
): MovePlan {
  if (sectionCount <= 0) {
    return { direction: "noop", steps: 0, wrapsRing: false, targetSection: 0 };
  }

  const N = sectionCount;
  const current = sectionFromV(currentV, N);
  const target = clampSection(targetSection, N);

  if (target === current) {
    return { direction: "noop", steps: 0, wrapsRing: false, targetSection: target };
  }

  if (target > current) {
    return {
      direction: "forward",
      steps: target - current,
      wrapsRing: false,
      targetSection: target,
    };
  }

  // target < current
  const backSteps = current - target;
  if (backSteps <= backThreshold) {
    return {
      direction: "back",
      steps: backSteps,
      wrapsRing: false,
      targetSection: target,
    };
  }

  // Далёкий «назад» (в т.ч. «Наверх» / target 0 при distance > threshold)
  // → вперёд через конец круга.
  return {
    direction: "forward",
    steps: N - current + target,
    wrapsRing: true,
    targetSection: target,
  };
}

/** Удобная обёртка, когда v ещё = sectionIndex (первый круг). */
export function planMoveFromSection(
  currentSection: number,
  targetSection: number,
  sectionCount: number,
  backThreshold: number = RING_BACK_THRESHOLD,
): MovePlan {
  const current = clampSection(currentSection, sectionCount);
  return planMove(current, targetSection, sectionCount, backThreshold);
}
