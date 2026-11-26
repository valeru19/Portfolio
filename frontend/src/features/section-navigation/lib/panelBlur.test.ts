import { describe, expect, it } from "vitest";

import {
  beginBlurTurnCrossfade,
  blurPxForTurnProgress,
  clearPanelBlur,
  effectivePanelScale,
  endBlurTurnCrossfade,
  idleVeilAmount,
  inactivePanelBlurPx,
  paintPanelBlur,
  paintPanelVeil,
  panelBlurPxForScale,
  veilAmountForTurnProgress,
  BLUR_TURN_MS_VAR,
  PANEL_BLUR_RADIUS_VAR,
  PANEL_VEIL_VAR,
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
  });
});

describe("veilAmountForTurnProgress", () => {
  it("crossfades from→1 and dest→0", () => {
    expect(veilAmountForTurnProgress("from", 0)).toBe(0);
    expect(veilAmountForTurnProgress("dest", 0)).toBe(1);
    expect(veilAmountForTurnProgress("from", 1)).toBe(1);
    expect(veilAmountForTurnProgress("dest", 1)).toBe(0);
    expect(veilAmountForTurnProgress("other", 0.5)).toBe(1);
  });
});

describe("panelBlurPxForScale", () => {
  it("caps css blur when panel is scaled up on screen (behind)", () => {
    const scaleBehind = effectivePanelScale(0, 2);
    expect(scaleBehind).toBeGreaterThan(1);
    const css = panelBlurPxForScale(scaleBehind);
    expect(css).toBeLessThanOrEqual(PANEL_BLUR_PX);
    expect(css).toBeGreaterThanOrEqual(10);
  });

  it("keeps active sharp and neighbors veiled", () => {
    expect(idleVeilAmount(0, 0)).toBe(0);
    expect(idleVeilAmount(1, 0)).toBe(1);
  });
});

describe("quantizeBlurPx", () => {
  it("rounds to whole pixels and zeroes near-zero values", () => {
    expect(quantizeBlurPx(0.04)).toBe(0);
    expect(quantizeBlurPx(3.4)).toBe(3);
  });
});

describe("paintPanelVeil", () => {
  it("writes veil amount and radius", () => {
    const el = document.createElement("section");
    paintPanelVeil(el, 0);
    expect(el.style.getPropertyValue(PANEL_VEIL_VAR)).toBe("0");
    paintPanelVeil(el, 1, inactivePanelBlurPx());
    expect(el.style.getPropertyValue(PANEL_VEIL_VAR)).toBe("1");
    expect(el.style.getPropertyValue(PANEL_BLUR_RADIUS_VAR)).toBe(`${inactivePanelBlurPx()}px`);
    clearPanelBlur(el);
    expect(el.style.getPropertyValue(PANEL_VEIL_VAR)).toBe("");
  });
});

describe("paintPanelBlur compat", () => {
  it("maps blur px to veil on/off", () => {
    const el = document.createElement("section");
    paintPanelBlur(el, 0);
    expect(el.style.getPropertyValue(PANEL_VEIL_VAR)).toBe("0");
    paintPanelBlur(el, 16);
    expect(el.style.getPropertyValue(PANEL_VEIL_VAR)).toBe("1");
  });
});

describe("beginBlurTurnCrossfade", () => {
  it("arms from/dest roles and veil targets", () => {
    const from = document.createElement("section");
    const dest = document.createElement("section");
    beginBlurTurnCrossfade(from, dest, 0.6, 8);
    expect(from.getAttribute(PANEL_STATE_ATTR.blurTurn)).toBe("from");
    expect(dest.getAttribute(PANEL_STATE_ATTR.blurTurn)).toBe("dest");
    expect(from.style.getPropertyValue(PANEL_VEIL_VAR)).toBe("1");
    expect(dest.style.getPropertyValue(PANEL_VEIL_VAR)).toBe("0");
    expect(from.style.getPropertyValue(BLUR_TURN_MS_VAR)).toBe("0.6s");
    endBlurTurnCrossfade(from, dest);
    expect(from.hasAttribute(PANEL_STATE_ATTR.blurTurn)).toBe(false);
  });
});
