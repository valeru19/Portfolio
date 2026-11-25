import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { loadGsap } from "../lib/loadGsap";
import {
  animationDurationMs,
  applySpiralLayoutToPanels,
  paintSpiralElement,
} from "../lib/spiralTransform";
import { snapRotationToSection } from "../model/geometry";
import { prefersReducedMotion } from "../model/prefersReducedMotion";
import { clampSectionIndex } from "../model/sectionIndex";

import type { PanelNodes } from "./useSpiralPanels";

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
      paintSpiralElement(spiral, rotationDeg, gsapRef.current);
      rotationRef.current = rotationDeg;
    },
    [spiralRef],
  );

  const buildSpiral = useCallback(() => {
    if (isAccessible) return;
    const spiral = spiralRef.current;
    if (!spiral) return;
    applySpiralLayoutToPanels(spiral, sectionIds, panelsRef.current, gsapRef.current);
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
      const goingBack = snapped > state.r;
      const duration = animationDurationMs(Math.abs(snapped - state.r), goingBack);

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
    paintSpiralTransform,
    buildSpiral,
    animateToRotation,
    ensureGsap,
    killMotion,
  };
}
