import { describe, expect, it } from "vitest";

import { animationDurationMs, animationEase } from "./spiralTransform";

describe("animationDurationMs", () => {
  it("keeps locked single-step timing", () => {
    const forward = animationDurationMs(90, false);
    expect(forward).toBeGreaterThanOrEqual(0.52);
    expect(forward).toBeLessThanOrEqual(0.66);
  });

  it("makes multi-section jumps slower than a single step", () => {
    const multi = animationDurationMs(360, false);
    expect(multi).toBeGreaterThan(animationDurationMs(90, false));
    expect(multi).toBeGreaterThanOrEqual(0.9);
    expect(multi).toBeLessThanOrEqual(1.7);
  });

  it("keeps long reverse within a bounded window", () => {
    const longBack = animationDurationMs(720, true);
    expect(longBack).toBeGreaterThanOrEqual(0.85);
    expect(longBack).toBeLessThanOrEqual(1.55);
  });
});

describe("animationEase", () => {
  it("uses sine.inOut forward single-step and power2.out for reverse/long", () => {
    expect(animationEase(90, false)).toBe("sine.inOut");
    expect(animationEase(90, true)).toBe("power2.out");
    expect(animationEase(720, true)).toBe("power2.out");
    expect(animationEase(360, false)).toBe("power2.out");
  });
});
