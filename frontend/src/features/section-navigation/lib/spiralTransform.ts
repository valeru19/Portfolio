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

/**
 * Per-frame spiral paint. Writes one compositor-only transform string —
 * cheaper than gsap.set every tick (no plugin/property parsing on the hot path).
 */
export function paintSpiralElement(spiral: HTMLElement, rotationDeg: number): void {
  const scale = spiralScaleFromRotation(rotationDeg);
  spiral.style.transform = `rotate(${rotationDeg}deg) scale(${scale}) translate3d(0,0,0)`;
}

let lastLayoutKey = "";

export function applySpiralLayoutToPanels(
  spiral: HTMLElement,
  sectionIds: SectionId[],
  panels: Map<SectionId, PanelNodes>,
  gsap: GsapLike | null,
): void {
  const layout = computeSpiralLayout(window.innerWidth, window.innerHeight);
  const layoutKey = `${layout.panelWidth}|${layout.panelHeight}|${layout.transformOrigin}|${sectionIds.length}`;
  const layoutUnchanged = layoutKey === lastLayoutKey;
  lastLayoutKey = layoutKey;

  spiral.style.transformOrigin = layout.transformOrigin;
  if (gsap) gsap.set(spiral, { transformOrigin: layout.transformOrigin });

  sectionIds.forEach((id, index) => {
    const nodes = panels.get(id);
    if (!nodes) return;
    if (!layoutUnchanged) {
      nodes.section.style.width = `${layout.panelWidth}px`;
      nodes.section.style.height = `${layout.panelHeight}px`;
      nodes.section.style.transformOrigin = layout.transformOrigin;
    }
    const rotation = panelRotationAtIndex(index);
    const scale = panelScaleAtIndex(index);
    // Always re-apply panel pose after reverse (callers only rebuild when needed).
    if (gsap) {
      gsap.set(nodes.section, {
        transformOrigin: layout.transformOrigin,
        rotation,
        scale,
        force3D: "auto",
      });
    } else {
      nodes.section.style.transform = `rotate(${rotation}deg) scale(${scale}) translate3d(0,0,0)`;
    }
  });
}

/** Test helper — clears layout cache between cases. */
export function resetSpiralLayoutCache(): void {
  lastLayoutKey = "";
}

/**
 * Seconds for a spiral turn.
 * Single step ~1s. Multi-step (back-to-top) scales with distance — one continuous tween.
 */
export function animationDurationMs(distanceDeg: number, goingBack: boolean): number {
  const steps = Math.max(1, distanceDeg / 90);
  if (steps <= 1.01) {
    const ceiling = goingBack ? 1.25 : 1.15;
    const floor = goingBack ? 0.95 : 0.9;
    return Math.min(ceiling, Math.max(floor, 0.8 + distanceDeg / 220));
  }
  const perStep = goingBack ? 0.6 : 0.48;
  const floor = goingBack ? 1.6 : 1.3;
  const ceiling = goingBack ? 4.5 : 3.2;
  return Math.min(ceiling, Math.max(floor, steps * perStep));
}

export function animationEase(distanceDeg: number, goingBack: boolean): string {
  const steps = Math.max(1, distanceDeg / 90);
  if (steps > 1.5) return "sine.inOut";
  if (goingBack) return "power2.out";
  return "sine.inOut";
}
