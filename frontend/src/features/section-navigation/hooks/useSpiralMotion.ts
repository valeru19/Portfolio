import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { loadGsap } from "../lib/loadGsap";
import { blurPxForTurnProgress, paintPanelBlur } from "../lib/panelBlur";
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
  markActive: (index: number) => void;
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
  const warmIdleRef = useRef(0);

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

  const scheduleWarm = useCallback(
    (index: number) => {
      if (warmIdleRef.current) {
        window.clearTimeout(warmIdleRef.current);
        warmIdleRef.current = 0;
      }
      // Defer decode off the turn-start frame — img.decode on the hot path hitchs.
      warmIdleRef.current = window.setTimeout(() => {
        warmIdleRef.current = 0;
        warmAround(index);
      }, 0);
    },
    [warmAround],
  );

  const finishScroll = useCallback(
    (targetRotation: number) => {
      const snapped = snapRotationToSection(targetRotation, sectionCount);
      const index = clampSectionIndex(Math.round(-snapped / 90), sectionCount);

      // Compositor pose + palette while is-spinning still kills color transitions.
      paintSpiralTransform(snapped);
      markActive(index);
      applyColors(index);
      onProgress?.(index);

      const runSettle = () => {
        scheduleWarm(index);
        setSpinning(false);
        onSettled(index);
        settleActivePanel(index);
      };

      // Double-rAF: let the last transform commit, then React/DOM settle.
      if (settleRafRef.current) cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = requestAnimationFrame(() => {
        settleRafRef.current = requestAnimationFrame(runSettle);
      });
    },
    [
      applyColors,
      markActive,
      onProgress,
      onSettled,
      paintSpiralTransform,
      scheduleWarm,
      sectionCount,
      setSpinning,
      settleActivePanel,
    ],
  );

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
      // Reverse / long jumps: refresh panel matrices BEFORE the tween so the
      // landing frame stays clean (end-of-turn rebuild was a visible hitch).
      const needsRebuild = goingBack || distanceDeg > 135;
      if (needsRebuild) {
        buildSpiral();
        paintSpiralTransform(startR);
      }

      // Do NOT applyColors / markActive / warm here — palette snaps and
      // data-far/content-visibility thrash are the remaining flicker sources.
      scheduleWarm(destIndex);

      const fromId = sectionIds[fromIndex];
      const destId = sectionIds[destIndex];
      const fromSection = fromId ? panelsRef.current.get(fromId)?.section : undefined;
      const destSection = destId ? panelsRef.current.get(destId)?.section : undefined;

      const paintTurnBlur = (progress: number) => {
        if (fromSection) {
          paintPanelBlur(fromSection, blurPxForTurnProgress("from", progress));
        }
        if (destSection && destSection !== fromSection) {
          paintPanelBlur(destSection, blurPxForTurnProgress("dest", progress));
        }
      };
      // Start of turn: outgoing sharp, incoming already soft (idle state).
      paintTurnBlur(0);

      if (prefersReducedMotion()) {
        if (gen !== motionGenRef.current) return;
        finishScroll(snapped);
        return;
      }

      const runTween = (gsap: NonNullable<GsapLike>) => {
        if (gen !== motionGenRef.current) return;
        const state = { r: startR };
        const duration = animationDurationMs(distanceDeg, goingBack);
        const ease = animationEase(distanceDeg, goingBack);

        tweenRef.current = gsap.to(state, {
          r: snapped,
          duration,
          ease,
          overwrite: true,
          onUpdate: () => {
            if (gen !== motionGenRef.current) return;
            paintSpiralTransform(state.r);
            const progress =
              distanceDeg < 0.01 ? 1 : Math.min(1, Math.abs(state.r - startR) / distanceDeg);
            paintTurnBlur(progress);
          },
          onComplete: () => {
            if (gen !== motionGenRef.current) return;
            tweenRef.current = null;
            finishScroll(snapped);
          },
        });
      };

      // Cached GSAP: start sync — `await` on an already-resolved promise still
      // yields a microtask and paints a frozen pre-tween frame (мерцание/пауза).
      if (gsapRef.current) {
        runTween(gsapRef.current);
        return;
      }

      const gsap = await ensureGsap();
      if (gen !== motionGenRef.current) return;
      if (!gsap) {
        finishScroll(snapped);
        return;
      }
      runTween(gsap);
    },
    [
      buildSpiral,
      clearScrollable,
      ensureGsap,
      finishScroll,
      isAccessible,
      paintSpiralTransform,
      panelsRef,
      scheduleWarm,
      sectionCount,
      sectionIds,
      setSpinning,
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
    if (warmIdleRef.current) {
      window.clearTimeout(warmIdleRef.current);
      warmIdleRef.current = 0;
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
