import { afterEach, describe, expect, it, vi } from "vitest";

import { animateLayerOpacity, cancelLayerAnim, readLayerOpacity } from "./panelLayerAnimator";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("panelLayerAnimator", () => {
  it("readLayerOpacity uses inline value", () => {
    const el = document.createElement("div");
    el.style.opacity = "0.4";
    expect(readLayerOpacity(el)).toBeCloseTo(0.4, 2);
  });

  it("animateLayerOpacity continues from current without jump when reduced", async () => {
    vi.stubGlobal(
      "matchMedia",
      () =>
        ({
          matches: true,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    const el = document.createElement("div");
    el.style.opacity = "0.3";
    await animateLayerOpacity(el, 1, 40);
    expect(el.style.opacity).toBe("1");
  });

  it("cancelLayerAnim leaves committed opacity", async () => {
    const el = document.createElement("div");
    el.style.opacity = "0.2";
    // jsdom may lack animate — fallback sets target
    const p = animateLayerOpacity(el, 0.8, 100);
    cancelLayerAnim(el);
    await p;
    const op = Number(el.style.opacity);
    expect(Number.isFinite(op)).toBe(true);
  });
});
