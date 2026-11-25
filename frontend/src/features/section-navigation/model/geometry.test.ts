import { describe, expect, it } from "vitest";

import {
  computeSpiralLayout,
  rotationForSectionIndex,
  sectionIndexFromRotation,
  snapRotationToSection,
  spiralScaleFromRotation,
  trimRotation,
} from "./geometry";
import { clampSectionIndex, stepSectionIndex } from "./sectionIndex";
import { ASPECT, PANEL_SIZE_RATIO } from "./constants";

describe("spiral geometry", () => {
  it("computes desktop layout with AXIS origin and φ-sized panels", () => {
    const layout = computeSpiralLayout(1200, 800);
    expect(layout.panelWidth).toBeCloseTo(1200 * PANEL_SIZE_RATIO);
    expect(layout.panelWidth).toBeCloseTo(1200 * ASPECT);
    expect(layout.originX).toBe(Math.floor(1200 * 0.7237));
  });

  it("uses full-width φ cells on portrait phones", () => {
    const layout = computeSpiralLayout(390, 844);
    expect(layout.panelWidth).toBe(390);
    expect(layout.panelHeight).toBe(390);
    expect(layout.originX).toBe(Math.floor(390 * (1 - 0.7237)));
  });

  it("keeps landscape tablets on the desktop φ branch (not full-width squares)", () => {
    const layout = computeSpiralLayout(900, 500);
    expect(layout.panelWidth).toBeCloseTo(900 * ASPECT);
    expect(layout.originX).toBe(Math.floor(900 * 0.7237));
  });

  it("maps rotation to section index within bounds", () => {
    expect(sectionIndexFromRotation(0, 9)).toBe(0);
    expect(sectionIndexFromRotation(-90, 9)).toBe(1);
    expect(sectionIndexFromRotation(-720, 9)).toBe(8);
    expect(sectionIndexFromRotation(90, 9)).toBe(0);
  });

  it("trims and snaps rotation to section steps", () => {
    expect(trimRotation(-1000, 5)).toBe(-360);
    expect(snapRotationToSection(-100, 5)).toBe(-90);
    expect(rotationForSectionIndex(3)).toBe(-270);
    expect(spiralScaleFromRotation(-90)).toBeCloseTo(Math.pow(ASPECT, -1));
  });
});

describe("section index steps", () => {
  it("clamps and steps forward/back without overshoot", () => {
    expect(clampSectionIndex(-2, 7)).toBe(0);
    expect(clampSectionIndex(99, 7)).toBe(6);
    expect(stepSectionIndex(0, -1, 7)).toBe(0);
    expect(stepSectionIndex(6, 1, 7)).toBe(6);
    expect(stepSectionIndex(2, 1, 7)).toBe(3);
  });
});
