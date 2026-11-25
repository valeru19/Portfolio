import { ASPECT, AXIS, SECTION_ROTATION_STEP_DEG, SMALL_SCREEN_MAX_WIDTH } from "./constants";

export type SpiralLayout = {
  originX: number;
  originY: number;
  panelWidth: number;
  panelHeight: number;
  transformOrigin: string;
};

export function computeSpiralLayout(viewportWidth: number, viewportHeight: number): SpiralLayout {
  const isSmallScreen = viewportWidth < SMALL_SCREEN_MAX_WIDTH;
  const isLandscape = viewportHeight < viewportWidth;

  let originX: number;
  let originY: number;
  let panelWidth: number;
  let panelHeight: number;

  if (isSmallScreen && !isLandscape) {
    originX = Math.floor((viewportWidth / ASPECT) * ASPECT * (1 - AXIS));
    originY = Math.floor((viewportWidth / ASPECT) * AXIS);
    panelWidth = viewportWidth;
    panelHeight = viewportWidth;
  } else {
    originX = Math.floor(viewportWidth * AXIS);
    originY = Math.floor(viewportWidth * ASPECT * AXIS);
    panelWidth = viewportWidth * ASPECT;
    panelHeight = viewportWidth * ASPECT;
  }

  return {
    originX,
    originY,
    panelWidth,
    panelHeight,
    transformOrigin: `${originX}px ${originY}px`,
  };
}

export function spiralScaleFromRotation(rotationDeg: number): number {
  return Math.pow(ASPECT, rotationDeg / SECTION_ROTATION_STEP_DEG);
}

export function panelScaleAtIndex(index: number): number {
  return Math.pow(ASPECT, index);
}

export function panelRotationAtIndex(index: number): number {
  return SECTION_ROTATION_STEP_DEG * index;
}

export function rotationForSectionIndex(index: number): number {
  return index * -SECTION_ROTATION_STEP_DEG;
}

export function trimRotation(rotationDeg: number, sectionCount: number): number {
  const minimum = -(sectionCount - 1) * SECTION_ROTATION_STEP_DEG;
  return Math.max(minimum, Math.min(0, rotationDeg));
}

export function sectionIndexFromRotation(rotationDeg: number, sectionCount: number): number {
  const index = Math.round(-rotationDeg / SECTION_ROTATION_STEP_DEG);
  return Math.min(sectionCount - 1, Math.max(0, index));
}

export function snapRotationToSection(rotationDeg: number, sectionCount: number): number {
  const snapped = Math.round(rotationDeg / SECTION_ROTATION_STEP_DEG) * SECTION_ROTATION_STEP_DEG;
  return trimRotation(snapped, sectionCount);
}
