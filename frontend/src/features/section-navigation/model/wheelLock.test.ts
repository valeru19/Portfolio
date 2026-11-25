import { describe, expect, it } from "vitest";

import { INITIAL_WHEEL_LOCK_STATE, clearWheelAccumulation, reduceWheelStep } from "./wheelLock";

describe("wheel lock", () => {
  it("does not step until threshold is reached", () => {
    const first = reduceWheelStep(INITIAL_WHEEL_LOCK_STATE, 20, 1000, { threshold: 40 });
    expect(first.step).toBe(0);
    expect(first.state.accumulatedDelta).toBe(20);

    const second = reduceWheelStep(first.state, 25, 1010, { threshold: 40 });
    expect(second.step).toBe(1);
    expect(second.state.accumulatedDelta).toBe(0);
  });

  it("blocks a second step while lock window is active", () => {
    const stepped = reduceWheelStep(INITIAL_WHEEL_LOCK_STATE, 80, 1000, {
      threshold: 40,
      lockMs: 480,
    });
    expect(stepped.step).toBe(1);

    const blocked = reduceWheelStep(stepped.state, 80, 1200, {
      threshold: 40,
      lockMs: 480,
    });
    expect(blocked.step).toBe(0);

    const afterLock = reduceWheelStep(stepped.state, 80, 1500, {
      threshold: 40,
      lockMs: 480,
    });
    expect(afterLock.step).toBe(1);
  });

  it("ignores wheel while busy (spinning)", () => {
    const result = reduceWheelStep(INITIAL_WHEEL_LOCK_STATE, 100, 1000, { isBusy: true });
    expect(result.step).toBe(0);
  });

  it("clears accumulation on decay", () => {
    const mid = reduceWheelStep(INITIAL_WHEEL_LOCK_STATE, 30, 1000);
    expect(clearWheelAccumulation(mid.state).accumulatedDelta).toBe(0);
  });
});
