import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { loadGsap } from "../lib/loadGsap";
import {
  computeSpiralLayout,
  panelRotationAtIndex,
  panelScaleAtIndex,
  snapRotationToSection,
  spiralScaleFromRotation,
} from "../model/geometry";
import { prefersReducedMotion } from "../model/prefersReducedMotion";
import { clampSectionIndex } from "../model/sectionIndex";

type PanelNodes = {
  section: HTMLElement;
  scroll: HTMLElement;
};

type GsapLike = Awaited<ReturnType<typeof loadGsap>>;

type Options = {
  sectionIds: SectionId[];
  sectionCount: number;
  isAccessible: boolean;
  spiralRef: MutableRefObject<HTMLDivElement | null>;
  panelsRef: MutableRefObject<Map<SectionId, PanelNodes>>;
  onSettled: (index: number) => void;
  markActive: (index: number) => void;
  applyColors: (index: number, force?: boolean) => void;
  clearScrollable: () => void;
  settleActivePanel: () => void;
};

export function useSpiralMotion({
  sectionIds,
  sectionCount,
  isAccessible,
  spiralRef,
  panelsRef,
  onSettled,
  markActive,
  applyColors,
  clearScrollable,
  settleActivePanel,
}: Options) {
  const rotationRef = useRef(0);
  const gsapRef = useRef<GsapLike | null>(null);
  const tweenRef = useRef<{ kill: () => void } | null>(null);
  const spinningRef = useRef(false);

  const setSpinning = useCallback((on: boolean) => {
    spinningRef.current = on;
    document.body.classList.toggle("is-spinning", on);
  }, []);

  const paintSpiralTransform = useCallback(
    (rotationDeg: number) => {
      const spiral = spiralRef.current;
      if (!spiral) return;
      const scale = spiralScaleFromRotation(rotationDeg);
      const gsap = gsapRef.current;
      if (gsap) {
        gsap.set(spiral, { rotation: rotationDeg, scale, force3D: true });
      } else {
        spiral.style.transform = `rotate(${rotationDeg}deg) scale(${scale}) translate3d(0,0,0)`;
      }
      rotationRef.current = rotationDeg;
    },
    [spiralRef],
  );

  const buildSpiral = useCallback(() => {
    if (isAccessible) return;
    const spiral = spiralRef.current;
    if (!spiral) return;
    const layout = computeSpiralLayout(window.innerWidth, window.innerHeight);
    spiral.style.transformOrigin = layout.transformOrigin;
    const gsap = gsapRef.current;
    if (gsap) gsap.set(spiral, { transformOrigin: layout.transformOrigin });

    sectionIds.forEach((id, index) => {
      const nodes = panelsRef.current.get(id);
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
  }, [isAccessible, panelsRef, sectionIds, spiralRef]);

  const finishScroll = useCallback(
    (targetRotation: number) => {
      const snapped = snapRotationToSection(targetRotation, sectionCount);
      rotationRef.current = snapped;
      paintSpiralTransform(snapped);
      const index = clampSectionIndex(Math.round(-snapped / 90), sectionCount);
      markActive(index);
      applyColors(index);
      buildSpiral();
      paintSpiralTransform(snapped);
      setSpinning(false);
      window.setTimeout(settleActivePanel, 48);
      onSettled(index);
    },
    [
      applyColors,
      buildSpiral,
      markActive,
      onSettled,
      paintSpiralTransform,
      sectionCount,
      setSpinning,
      settleActivePanel,
    ],
  );

  const ensureGsap = useCallback(async () => {
    if (prefersReducedMotion()) return null;
    if (gsapRef.current) return gsapRef.current;
    try {
      gsapRef.current = await loadGsap();
      return gsapRef.current;
    } catch {
      gsapRef.current = null;
      return null;
    }
  }, []);

  const animateToRotation = useCallback(
    async (targetRotation: number) => {
      if (isAccessible) return;
      const snapped = snapRotationToSection(targetRotation, sectionCount);
      const destIndex = clampSectionIndex(Math.round(-snapped / 90), sectionCount);
      const alreadyThere = Math.abs(snapped - rotationRef.current) < 0.05;

      if (alreadyThere && !spinningRef.current) {
        finishScroll(snapped);
        return;
      }

      tweenRef.current?.kill();
      clearScrollable();
      setSpinning(true);
      markActive(destIndex);
      applyColors(destIndex);

      if (prefersReducedMotion()) {
        finishScroll(snapped);
        return;
      }

      const gsap = await ensureGsap();
      buildSpiral();

      if (!gsap) {
        finishScroll(snapped);
        return;
      }

      const state = { r: rotationRef.current };
      const dist = Math.abs(snapped - state.r);
      const goingBack = snapped > state.r;
      const duration = Math.min(goingBack ? 0.52 : 0.48, Math.max(0.36, 0.3 + dist / 300));

      tweenRef.current = gsap.to(state, {
        r: snapped,
        duration,
        ease: goingBack ? "power2.out" : "power3.out",
        overwrite: true,
        onUpdate: () => {
          paintSpiralTransform(state.r);
        },
        onComplete: () => {
          tweenRef.current = null;
          finishScroll(snapped);
        },
      });
    },
    [
      applyColors,
      buildSpiral,
      clearScrollable,
      ensureGsap,
      finishScroll,
      isAccessible,
      markActive,
      paintSpiralTransform,
      sectionCount,
      setSpinning,
    ],
  );

  const killMotion = useCallback(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    setSpinning(false);
  }, [setSpinning]);

  return {
    rotationRef,
    spinningRef,
    gsapRef,
    paintSpiralTransform,
    buildSpiral,
    animateToRotation,
    ensureGsap,
    killMotion,
  };
}
