import type { SectionId } from "@/shared/content";

import {
  computeSpiralLayout,
  panelRotationAtIndex,
  panelScaleAtIndex,
  spiralScaleFromRotation,
} from "../model/geometry";

type PanelNodes = {
  section: HTMLElement;
  scroll: HTMLElement;
};

type GsapLike = {
  set: (target: object, vars: Record<string, unknown>) => void;
};

export function paintSpiralElement(
  spiral: HTMLElement,
  rotationDeg: number,
  gsap: GsapLike | null,
): void {
  const scale = spiralScaleFromRotation(rotationDeg);
  if (gsap) {
    gsap.set(spiral, { rotation: rotationDeg, scale, force3D: true });
  } else {
    spiral.style.transform = `rotate(${rotationDeg}deg) scale(${scale}) translate3d(0,0,0)`;
  }
}

export function applySpiralLayoutToPanels(
  spiral: HTMLElement,
  sectionIds: SectionId[],
  panels: Map<SectionId, PanelNodes>,
  gsap: GsapLike | null,
): void {
  const layout = computeSpiralLayout(window.innerWidth, window.innerHeight);
  spiral.style.transformOrigin = layout.transformOrigin;
  if (gsap) gsap.set(spiral, { transformOrigin: layout.transformOrigin });

  sectionIds.forEach((id, index) => {
    const nodes = panels.get(id);
    if (!nodes) return;
    nodes.section.style.width = `${layout.panelWidth}px`;
    nodes.section.style.height = `${layout.panelHeight}px`;
    nodes.section.style.transformOrigin = layout.transformOrigin;
    const rotation = panelRotationAtIndex(index);
    const scale = panelScaleAtIndex(index);
    if (gsap) {
      gsap.set(nodes.section, {
        transformOrigin: layout.transformOrigin,
        rotation,
        scale,
        force3D: true,
      });
    } else {
      nodes.section.style.transform = `rotate(${rotation}deg) scale(${scale}) translate3d(0,0,0)`;
    }
  });
}

export function animationDurationMs(distanceDeg: number, goingBack: boolean): number {
  return Math.min(goingBack ? 0.52 : 0.48, Math.max(0.36, 0.3 + distanceDeg / 300));
}
