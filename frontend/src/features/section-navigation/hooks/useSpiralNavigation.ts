import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import type { SectionId } from "@/shared/content";
import { useTheme } from "@/shared/theme";

import { rotationForSectionIndex } from "../model/geometry";
import type { SpiralNavigationValue } from "../model/navigationContext";
import { prefersReducedMotion } from "../model/prefersReducedMotion";
import { clampSectionIndex, stepSectionIndex } from "../model/sectionIndex";

import { useAccessibleMode } from "./useAccessibleMode";
import { useKeyboardStep } from "./useKeyboardStep";
import { useSpiralDomEffects } from "./useSpiralDomEffects";
import { useSpiralMotion } from "./useSpiralMotion";
import { useSpiralPanels } from "./useSpiralPanels";
import { useTouchStep } from "./useTouchStep";
import { useWheelStep } from "./useWheelStep";

type Options = {
  sectionIds: SectionId[];
};

export function useSpiralNavigation({ sectionIds }: Options): SpiralNavigationValue {
  const { theme } = useTheme();
  const { isAccessible, toggleAccessible } = useAccessibleMode();
  const sectionCount = sectionIds.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const spiralRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const currentIndexRef = useRef(0);
  const targetIndexRef = useRef(0);
  const pendingIndexRef = useRef(0);
  const spinningFlagRef = useRef(false);
  const animateToRotationRef = useRef<(rotation: number) => Promise<void>>(async () => undefined);

  currentIndexRef.current = currentIndex;
  targetIndexRef.current = targetIndex;

  const {
    panelsRef,
    applyColors,
    markActive,
    clearScrollable,
    warmAround,
    settleActivePanel,
    registerPanel,
  } = useSpiralPanels({
    sectionIds,
    theme,
    isAccessible,
    currentIndexRef,
    spinningFlagRef,
  });

  const onProgress = useCallback((index: number) => {
    // Mid-turn HUD only — keep spinning lock + pending target intact.
    // startTransition keeps the GSAP frame off the React sync path.
    currentIndexRef.current = index;
    startTransition(() => {
      setCurrentIndex(index);
    });
  }, []);

  const onSettled = useCallback((index: number) => {
    currentIndexRef.current = index;
    setCurrentIndex(index);

    const pending = clampSectionIndex(pendingIndexRef.current, sectionCount);
    if (pending !== index) {
      // Intent queue: continue to the latest requested section without thrash.
      targetIndexRef.current = pending;
      setTargetIndex(pending);
      spinningFlagRef.current = true;
      setIsSpinning(true);
      void animateToRotationRef.current(rotationForSectionIndex(pending));
      return;
    }

    spinningFlagRef.current = false;
    targetIndexRef.current = index;
    pendingIndexRef.current = index;
    setTargetIndex(index);
    setIsSpinning(false);
  }, [sectionCount]);

  const {
    rotationRef,
    spinningRef,
    paintSpiralTransform,
    buildSpiral,
    animateToRotation,
    ensureGsap,
    killMotion,
  } = useSpiralMotion({
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
  });

  animateToRotationRef.current = animateToRotation;

  const goTo = useCallback(
    (index: number) => {
      const next = clampSectionIndex(index, sectionCount);
      pendingIndexRef.current = next;
      targetIndexRef.current = next;
      setTargetIndex(next);

      if (isAccessible) {
        setCurrentIndex(next);
        currentIndexRef.current = next;
        applyColors(next, true);
        const id = sectionIds[next];
        const nodes = id ? panelsRef.current.get(id) : undefined;
        nodes?.section.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        return;
      }

      // While a turn is in flight, only update pending — never kill/restart.
      if (spinningFlagRef.current || spinningRef.current) {
        return;
      }

      spinningFlagRef.current = true;
      setIsSpinning(true);
      void animateToRotation(rotationForSectionIndex(next));
    },
    [animateToRotation, applyColors, isAccessible, panelsRef, sectionCount, sectionIds, spinningRef],
  );

  const goNext = useCallback(() => {
    const next = stepSectionIndex(pendingIndexRef.current, 1, sectionCount);
    if (next === pendingIndexRef.current) return;
    goTo(next);
  }, [goTo, sectionCount]);

  const goPrev = useCallback(() => {
    const next = stepSectionIndex(pendingIndexRef.current, -1, sectionCount);
    if (next === pendingIndexRef.current) return;
    goTo(next);
  }, [goTo, sectionCount]);

  const getActiveScrollBox = useCallback(() => {
    const idx = spinningRef.current ? pendingIndexRef.current : currentIndexRef.current;
    const id = sectionIds[idx];
    return id ? (panelsRef.current.get(id)?.scroll ?? null) : null;
  }, [panelsRef, sectionIds, spinningRef]);

  const onStep = useCallback(
    (direction: 1 | -1) => {
      const next = stepSectionIndex(pendingIndexRef.current, direction, sectionCount);
      if (next === pendingIndexRef.current) return;
      goTo(next);
    },
    [goTo, sectionCount],
  );

  const getIsBusy = useCallback(
    () => spinningFlagRef.current || spinningRef.current || isSpinning,
    [isSpinning, spinningRef],
  );

  useWheelStep({
    enabled: !isAccessible,
    getIsBusy,
    getActiveScrollBox,
    onStep,
  });
  useTouchStep({ enabled: !isAccessible, onStep });
  useKeyboardStep({ enabled: !isAccessible, onStep });

  useEffect(() => {
    applyColors(currentIndexRef.current, true);
  }, [theme, applyColors]);

  useSpiralDomEffects({
    isAccessible,
    sectionIds,
    spiralRef,
    panelsRef,
    rotationRef,
    spinningRef,
    currentIndexRef,
    killMotion,
    ensureGsap,
    buildSpiral,
    paintSpiralTransform,
    markActive,
    applyColors,
    settleActivePanel,
    setIsSpinning,
    setCurrentIndex,
    setTargetIndex,
    spinningFlagRef,
    pendingIndexRef,
  });

  return {
    sectionIds,
    currentIndex,
    targetIndex,
    isAccessible,
    isSpinning,
    goTo,
    goNext,
    goPrev,
    toggleAccessible,
    registerPanel,
    spiralRef,
    stageRef,
  };
}
