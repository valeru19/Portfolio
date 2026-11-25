import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { loadGsap } from "../lib/loadGsap";
import {
  animationDurationMs,
  animationEase,
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
  onProgress?: (index: number) => void;
  markActive: (index: number, options?: { incomingIndex?: number }) => void;
  applyColors: (index: number, force?: boolean) => void;
  clearScrollable: () => void;
  warmAround: (index: number) => void;
  settleActivePanel: (forIndex?: number) => void;
};

export function useSpiralMotion({
  sectionIds,
  sectionCount,
  isAccessible,
  spiralRef,
  panelsRef,
  onSettled,
  onProgress,
  markActive,
  applyColors,
  clearScrollable,
  warmAround,
  settleActivePanel,
}: Options) {
  const rotationRef = useRef(0);
  const gsapRef = useRef<GsapLike | null>(null);
  const tweenRef = useRef<{ kill: () => void } | null>(null);
  const spinningRef = useRef(false);
  const motionGenRef = useRef(0);
  const settleRafRef = useRef(0);

  const setSpinning = useCallback((on: boolean) => {
    spinningRef.current = on;
    document.body.classList.toggle("is-spinning", on);
  }, []);

  const paintSpiralTransform = useCallback(
    (rotationDeg: number) => {
      const spiral = spiralRef.current;
      if (!spiral) return;
      paintSpiralElement(spiral, rotationDeg);
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

  const finishScroll = useCallback(
    (targetRotation: number, options?: { rebuild?: boolean }) => {
      const snapped = snapRotationToSection(targetRotation, sectionCount);
      const index = clampSectionIndex(Math.round(-snapped / 90), sectionCount);
      const rebuild = options?.rebuild ?? false;

      // Sync compositor pose first — one clean frame before any DOM settle work.
      paintSpiralTransform(snapped);
      markActive(index);
      applyColors(index);
      onProgress?.(index);

      const runSettle = () => {
        if (rebuild) {
          buildSpiral();
          paintSpiralTransform(snapped);
        }
        warmAround(index);
        setSpinning(false);
        onSettled(index);
        settleActivePanel(index);
      };

      // Double-rAF: let the last transform commit to the compositor, then do
      // React/DOM settle so the hitch isn't in the same frame as the motion.
      if (settleRafRef.current) cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = requestAnimationFrame(() => {
        settleRafRef.current = requestAnimationFrame(runSettle);
      });
    },
    [
      applyColors,
      buildSpiral,
      markActive,
      onProgress,
      onSettled,
      paintSpiralTransform,
      sectionCount,
      setSpinning,
      settleActivePanel,
      warmAround,
    ],
  );

  const animateToRotation = useCallback(
    async (targetRotation: number) => {
      if (isAccessible) return;
      const snapped = snapRotationToSection(targetRotation, sectionCount);
      const destIndex = clampSectionIndex(Math.round(-snapped / 90), sectionCount);
      const alreadyThere = Math.abs(snapped - rotationRef.current) < 0.05;

      if (alreadyThere && !spinningRef.current) {
        finishScroll(snapped, { rebuild: false });
        return;
      }

      const gen = ++motionGenRef.current;
      tweenRef.current?.kill();
      tweenRef.current = null;
      if (settleRafRef.current) {
        cancelAnimationFrame(settleRafRef.current);
        settleRafRef.current = 0;
      }
      clearScrollable();
      setSpinning(true);

      const fromIndex = clampSectionIndex(Math.round(-rotationRef.current / 90), sectionCount);
      const startR = rotationRef.current;
      const goingBack = snapped > startR;
      const distanceDeg = Math.abs(snapped - startR);
      // Rebuild matrices only after reverse / long jumps (scale-down blank fix).
      // Single forward 90° hops leave panel matrices untouched — skipping rebuild
      // removes the micro-hitch at the end of every step.
      const needsRebuild = goingBack || distanceDeg > 135;

      if (goingBack) {
        markActive(destIndex, {
          incomingIndex: fromIndex !== destIndex ? fromIndex : undefined,
        });
      } else {
        markActive(fromIndex, {
          incomingIndex: fromIndex !== destIndex ? destIndex : undefined,
        });
      }
      warmAround(destIndex);
      // Destination palette up front — no mid-turn CSS-var writes (those paint).
      applyColors(destIndex);

      if (prefersReducedMotion()) {
        if (gen !== motionGenRef.current) return;
        finishScroll(snapped, { rebuild: needsRebuild });
        return;
      }

      const gsap = await ensureGsap();
      if (gen !== motionGenRef.current) return;

      if (!gsap) {
        finishScroll(snapped, { rebuild: needsRebuild });
        return;
      }

      const state = { r: startR };
      const duration = animationDurationMs(distanceDeg, goingBack);
      const ease = animationEase(distanceDeg, goingBack);

      tweenRef.current = gsap.to(state, {
        r: snapped,
        duration,
        ease,
        overwrite: true,
        // Hot path: ONLY write the spiral transform. No colors, markActive,
        // React, or warm — those are what caused the remaining micro-stutters.
        onUpdate: () => {
          if (gen !== motionGenRef.current) return;
          paintSpiralTransform(state.r);
        },
        onComplete: () => {
          if (gen !== motionGenRef.current) return;
          tweenRef.current = null;
          finishScroll(snapped, { rebuild: needsRebuild });
        },
      });
    },
    [
      applyColors,
      clearScrollable,
      ensureGsap,
      finishScroll,
      isAccessible,
      markActive,
      paintSpiralTransform,
      sectionCount,
      setSpinning,
      warmAround,
    ],
  );

  const killMotion = useCallback(() => {
    motionGenRef.current += 1;
    tweenRef.current?.kill();
    tweenRef.current = null;
    if (settleRafRef.current) {
      cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = 0;
    }
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
