import { describe, expect, it } from "vitest";

import { RING_BACK_THRESHOLD, planMove, planMoveFromSection, sectionFromV } from "./ringNavigation";

describe("sectionFromV", () => {
  it("maps v across many rings", () => {
    const N = 5;
    let v = 0;
    for (let i = 0; i < 40; i += 1) {
      expect(sectionFromV(v, N)).toBe(i % N);
      v += 1;
    }
  });

  it("handles N=1", () => {
    expect(sectionFromV(0, 1)).toBe(0);
    expect(sectionFromV(7, 1)).toBe(0);
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

  it("threshold 4 keeps one more reverse; target 0 still wraps when beyond", () => {
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

  it("wrap then section matches target", () => {
    const N = 8;
    const currentV = 6;
    const plan = planMove(currentV, 1, N, 3);
    expect(plan.wrapsRing).toBe(true);
    expect(sectionFromV(currentV + plan.steps, N)).toBe(1);
  });
});
