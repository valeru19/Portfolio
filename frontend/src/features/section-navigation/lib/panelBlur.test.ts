import { describe, expect, it } from "vitest";

import {
  blurPxForTurnProgress,
  clearPanelBlur,
  inactivePanelBlurPx,
  paintPanelBlur,
} from "./panelBlur";

describe("blurPxForTurnProgress", () => {
  it("starts sharp on from and blurred on dest, then swaps by the end", () => {
    expect(blurPxForTurnProgress("from", 0, 8)).toBe(0);
    expect(blurPxForTurnProgress("dest", 0, 8)).toBe(8);
    expect(blurPxForTurnProgress("from", 1, 8)).toBe(8);
    expect(blurPxForTurnProgress("dest", 1, 8)).toBe(0);
    expect(blurPxForTurnProgress("from", 0.5, 8)).toBe(4);
    expect(blurPxForTurnProgress("dest", 0.5, 8)).toBe(4);
  });

  it("keeps other panels fully blurred for the whole turn", () => {
    expect(blurPxForTurnProgress("other", 0, 8)).toBe(8);
    expect(blurPxForTurnProgress("other", 0.5, 8)).toBe(8);
    expect(blurPxForTurnProgress("other", 1, 8)).toBe(8);
  });
});

describe("paintPanelBlur", () => {
  it("writes none for near-zero blur and clears via clearPanelBlur", () => {
    const el = document.createElement("section");
    paintPanelBlur(el, 0);
    expect(el.style.filter).toBe("none");
    paintPanelBlur(el, inactivePanelBlurPx());
    expect(el.style.filter).toContain("blur(");
    clearPanelBlur(el);
    expect(el.style.filter).toBe("");
  });
});
