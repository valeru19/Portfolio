import { describe, expect, it } from "vitest";

import {
  RING_BACK_THRESHOLD,
  applyMovePlan,
  canStepGesture,
  panelKeyFromV,
  planMove,
  planMoveFromSection,
  ringFromV,
  ringLayoutIndexBySectionIds,
  sectionFromV,
} from "./ringNavigation";

describe("sectionFromV / ringFromV", () => {
  it("maps v across many rings", () => {
    const N = 5;
    let v = 0;
    for (let i = 0; i < 40; i += 1) {
      expect(sectionFromV(v, N)).toBe(i % N);
      expect(ringFromV(v, N)).toBe(Math.floor(i / N));
      v += 1;
    }
  });

  it("handles N=1", () => {
    expect(sectionFromV(0, 1)).toBe(0);
    expect(sectionFromV(7, 1)).toBe(0);
    expect(ringFromV(7, 1)).toBe(7);
  });
});

describe("planMove", () => {
  it("noop when target == current", () => {
    expect(planMove(3, 3, 8)).toEqual({
      direction: "noop",
      steps: 0,
      wrapsRing: false,
      targetSection: 3,
    });
  });

  it("forward without wrap", () => {
    expect(planMove(1, 4, 8)).toEqual({
      direction: "forward",
      steps: 3,
      wrapsRing: false,
      targetSection: 4,
    });
  });

  it("short back within threshold 3", () => {
    expect(planMove(5, 3, 8, 3)).toEqual({
      direction: "back",
      steps: 2,
      wrapsRing: false,
      targetSection: 3,
    });
    expect(planMove(5, 2, 8, 3)).toEqual({
      direction: "back",
      steps: 3,
      wrapsRing: false,
      targetSection: 2,
    });
  });

  it("far back beyond threshold wraps forward", () => {
    expect(planMove(5, 1, 8, 3)).toEqual({
      direction: "forward",
      steps: 8 - 5 + 1,
      wrapsRing: true,
      targetSection: 1,
    });
  });

  it("threshold 4 keeps one more reverse", () => {
    expect(planMove(5, 1, 8, 4)).toEqual({
      direction: "back",
      steps: 4,
      wrapsRing: false,
      targetSection: 1,
    });
    expect(planMove(5, 0, 8, 4)).toEqual({
      direction: "forward",
      steps: 8 - 5 + 0,
      wrapsRing: true,
      targetSection: 0,
    });
  });

  it.each([1, 2, 3, 5, 8])("Наверх (target 0) from every section, N=%s", (N) => {
    for (let s = 0; s < N; s += 1) {
      const plan = planMoveFromSection(s, 0, N, RING_BACK_THRESHOLD);
      if (s === 0) {
        expect(plan.direction).toBe("noop");
        continue;
      }
      const back = s;
      if (back <= RING_BACK_THRESHOLD) {
        expect(plan).toMatchObject({ direction: "back", steps: back, wrapsRing: false });
      } else {
        expect(plan).toMatchObject({
          direction: "forward",
          steps: N - s,
          wrapsRing: true,
          targetSection: 0,
        });
      }
    }
  });

  it("Наверх from last is one forward wrap step when N > threshold+1", () => {
    const N = 7;
    const plan = planMoveFromSection(N - 1, 0, N);
    expect(plan).toEqual({
      direction: "forward",
      steps: 1,
      wrapsRing: true,
      targetSection: 0,
    });
  });

  it("applyMovePlan grows v across rings", () => {
    let v = 0;
    const N = 5;
    for (let i = 0; i < 12; i += 1) {
      const plan = planMove(v, sectionFromV(v + 1, N), N);
      v = applyMovePlan(v, plan);
    }
    expect(v).toBe(12);
    expect(sectionFromV(v, N)).toBe(2);
    expect(ringFromV(v, N)).toBe(2);
  });

  it("wrap then section matches target", () => {
    const N = 8;
    const currentV = 6;
    const plan = planMove(currentV, 1, N, 3);
    expect(plan.wrapsRing).toBe(true);
    const next = applyMovePlan(currentV, plan);
    expect(sectionFromV(next, N)).toBe(1);
  });
});

describe("canStepGesture", () => {
  it("blocks forward on last and back on first", () => {
    expect(canStepGesture(0, -1, 5)).toBe(false);
    expect(canStepGesture(0, 1, 5)).toBe(true);
    expect(canStepGesture(4, 1, 5)).toBe(false);
    expect(canStepGesture(4, -1, 5)).toBe(true);
    expect(canStepGesture(2, 1, 5)).toBe(true);
  });

  it("N=2 edges", () => {
    expect(canStepGesture(0, -1, 2)).toBe(false);
    expect(canStepGesture(1, 1, 2)).toBe(false);
  });
});

describe("panelKeyFromV", () => {
  it("is unique per v", () => {
    expect(panelKeyFromV(0)).toBe("v0");
    expect(panelKeyFromV(9)).toBe("v9");
  });
});

describe("ringLayoutIndexBySectionIds", () => {
  const ids = ["hero", "about", "stack", "contacts"];

  it("moves first to slot N on last section", () => {
    const map = ringLayoutIndexBySectionIds(ids, 3);
    expect(map?.get("hero")).toBe(4);
    expect(map?.get("contacts")).toBe(3);
  });

  it("returns undefined when not on last", () => {
    expect(ringLayoutIndexBySectionIds(ids, 2)).toBeUndefined();
  });
});
