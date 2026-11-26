import { describe, expect, it } from "vitest";

import {
  beginBlurTurnCrossfade,
  blurPxForTurnProgress,
  clearPanelBlur,
  effectivePanelScale,
  endBlurTurnCrossfade,
  idleBlurPxForPanel,
  inactivePanelBlurPx,
  paintPanelBlur,
  panelBlurPxForScale,
  BLUR_TURN_MS_VAR,
  PANEL_BLUR_VAR,
  quantizeBlurPx,
} from "./panelBlur";
import { PANEL_STATE_ATTR } from "../model/panelStateAttrs";
import { PANEL_BLUR_PX } from "../model/constants";

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

describe("panelBlurPxForScale", () => {
  it("caps css blur when panel is scaled up on screen (behind)", () => {
    const scaleBehind = effectivePanelScale(0, 2);
    expect(scaleBehind).toBeGreaterThan(1);
    const css = panelBlurPxForScale(scaleBehind);
    expect(css).toBeLessThanOrEqual(PANEL_BLUR_PX);
    expect(css).toBeGreaterThanOrEqual(8);
  });

  it("keeps neighbor blur at the design ceiling when scale ≤ 1", () => {
    expect(panelBlurPxForScale(1)).toBe(PANEL_BLUR_PX);
    expect(idleBlurPxForPanel(1, 0)).toBe(PANEL_BLUR_PX);
    expect(idleBlurPxForPanel(0, 0)).toBe(0);
  });
});

describe("quantizeBlurPx", () => {
  it("rounds to whole pixels and zeroes near-zero values", () => {
    expect(quantizeBlurPx(0.04)).toBe(0);
    expect(quantizeBlurPx(3.4)).toBe(3);
    expect(quantizeBlurPx(3.6)).toBe(4);
  });

  it("supports coarser mid-turn steps", () => {
    expect(quantizeBlurPx(3.4, 2)).toBe(4);
    expect(quantizeBlurPx(2.2, 2)).toBe(2);
  });
});

describe("paintPanelBlur", () => {
  it("writes --panel-blur and clears via clearPanelBlur", () => {
    const el = document.createElement("section");
    paintPanelBlur(el, 0);
    expect(el.style.getPropertyValue(PANEL_BLUR_VAR)).toBe("0px");
    paintPanelBlur(el, inactivePanelBlurPx());
    expect(el.style.getPropertyValue(PANEL_BLUR_VAR)).toBe(`${inactivePanelBlurPx()}px`);
    clearPanelBlur(el);
    expect(el.style.getPropertyValue(PANEL_BLUR_VAR)).toBe("");
  });
});

describe("beginBlurTurnCrossfade", () => {
  it("arms from/dest roles and targets max→0 / 0→max", () => {
    const from = document.createElement("section");
    const dest = document.createElement("section");
    beginBlurTurnCrossfade(from, dest, 0.6, 8);
    expect(from.getAttribute(PANEL_STATE_ATTR.blurTurn)).toBe("from");
    expect(dest.getAttribute(PANEL_STATE_ATTR.blurTurn)).toBe("dest");
    expect(from.style.getPropertyValue(PANEL_BLUR_VAR)).toBe("8px");
    expect(dest.style.getPropertyValue(PANEL_BLUR_VAR)).toBe("0px");
    expect(from.style.getPropertyValue(BLUR_TURN_MS_VAR)).toBe("0.6s");
    endBlurTurnCrossfade(from, dest);
    expect(from.hasAttribute(PANEL_STATE_ATTR.blurTurn)).toBe(false);
    expect(from.style.getPropertyValue(BLUR_TURN_MS_VAR)).toBe("");
  });
});
