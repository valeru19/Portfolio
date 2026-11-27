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

  it("allows longer reverse multi jumps for smoother Наверх (~2.0–2.2s)", () => {
    const longBack = animationDurationMs(540, true);
    expect(longBack).toBeGreaterThanOrEqual(1.6);
    expect(longBack).toBeLessThanOrEqual(2.2);
    expect(longBack).toBeGreaterThan(animationDurationMs(540, false));
  });
});

describe("animationEase", () => {
  it("keeps locked single-step sine.inOut both ways", () => {
    expect(animationEase(90, false)).toBe("sine.inOut");
    expect(animationEase(90, true)).toBe("sine.inOut");
  });

  it("uses sine.inOut for long reverse and power2.out for long forward", () => {
    expect(animationEase(720, true)).toBe("sine.inOut");
    expect(animationEase(360, false)).toBe("power2.out");
  });
});
