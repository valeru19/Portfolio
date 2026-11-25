import { WHEEL_STEP_LOCK_MS, WHEEL_THRESHOLD } from "./constants";

export type WheelLockState = {
  accumulatedDelta: number;
  lockedUntilMs: number;
};

export const INITIAL_WHEEL_LOCK_STATE: WheelLockState = {
  accumulatedDelta: 0,
  lockedUntilMs: 0,
};

export type WheelStepResult = {
  state: WheelLockState;
  /** +1 = next section, -1 = previous, 0 = no step yet */
  step: -1 | 0 | 1;
};

/**
 * Pure wheel accumulator + step lock (legacy: one section per gesture window).
 * Callers reset `accumulatedDelta` on decay timer separately.
 */
export function reduceWheelStep(
  state: WheelLockState,
  deltaY: number,
  nowMs: number,
  options: { threshold?: number; lockMs?: number; isBusy?: boolean } = {},
): WheelStepResult {
  const threshold = options.threshold ?? WHEEL_THRESHOLD;
  const lockMs = options.lockMs ?? WHEEL_STEP_LOCK_MS;

  if (options.isBusy || nowMs < state.lockedUntilMs) {
    return { state, step: 0 };
  }

  const accumulatedDelta = state.accumulatedDelta + deltaY;
  if (Math.abs(accumulatedDelta) < threshold) {
    return {
      state: { ...state, accumulatedDelta },
      step: 0,
    };
  }

  const step: 1 | -1 = accumulatedDelta > 0 ? 1 : -1;
  return {
    state: {
      accumulatedDelta: 0,
      lockedUntilMs: nowMs + lockMs,
    },
    step,
  };
}

export function clearWheelAccumulation(state: WheelLockState): WheelLockState {
  return { ...state, accumulatedDelta: 0 };
}
