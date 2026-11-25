import { describe, expect, it } from "vitest";

import { animationDurationMs, animationEase } from "./spiralTransform";

describe("animationDurationMs", () => {
  it("returns a soft duration for a 90° turn", () => {
    const forward = animationDurationMs(90, false);
    expect(forward).toBeGreaterThanOrEqual(0.9);
    expect(forward).toBeLessThanOrEqual(1.15);
  });

  it("scales duration for a long reverse jump (back-to-top)", () => {
    const longBack = animationDurationMs(720, true);
    expect(longBack).toBeGreaterThan(3);
    expect(longBack).toBeLessThanOrEqual(4.5);
    expect(longBack).toBeGreaterThan(animationDurationMs(90, true));
  });
});

describe("animationEase", () => {
  it("uses sine.inOut for multi-step jumps", () => {
    expect(animationEase(720, true)).toBe("sine.inOut");
    expect(animationEase(90, true)).toBe("power2.out");
    expect(animationEase(90, false)).toBe("sine.inOut");
  });
});
