import { useCallback, useEffect, useRef, useState } from "react";

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
  const spinningFlagRef = useRef(false);

  currentIndexRef.current = currentIndex;
  targetIndexRef.current = targetIndex;

  const { panelsRef, applyColors, markActive, clearScrollable, settleActivePanel, registerPanel } =
    useSpiralPanels({
      sectionIds,
      theme,
      isAccessible,
      currentIndexRef,
      spinningFlagRef,
    });

  const onSettled = useCallback((index: number) => {
    spinningFlagRef.current = false;
    setCurrentIndex(index);
    setTargetIndex(index);
    setIsSpinning(false);
  }, []);

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
    markActive,
    applyColors,
    clearScrollable,
    settleActivePanel,
  });

  const goTo = useCallback(
    (index: number) => {
      const next = clampSectionIndex(index, sectionCount);
      setTargetIndex(next);
      if (isAccessible) {
        setCurrentIndex(next);
        applyColors(next, true);
        const id = sectionIds[next];
        const nodes = id ? panelsRef.current.get(id) : undefined;
        nodes?.section.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        return;
      }
      spinningFlagRef.current = true;
      setIsSpinning(true);
      void animateToRotation(rotationForSectionIndex(next));
    },
    [animateToRotation, applyColors, isAccessible, panelsRef, sectionCount, sectionIds],
  );

  const goNext = useCallback(() => {
    goTo(stepSectionIndex(targetIndexRef.current, 1, sectionCount));
  }, [goTo, sectionCount]);

  const goPrev = useCallback(() => {
    goTo(stepSectionIndex(targetIndexRef.current, -1, sectionCount));
  }, [goTo, sectionCount]);

  const getActiveScrollBox = useCallback(() => {
    const idx = spinningRef.current ? targetIndexRef.current : currentIndexRef.current;
    const id = sectionIds[idx];
    return id ? (panelsRef.current.get(id)?.scroll ?? null) : null;
  }, [panelsRef, sectionIds, spinningRef]);

  const onStep = useCallback(
    (direction: 1 | -1) => {
      goTo(stepSectionIndex(targetIndexRef.current, direction, sectionCount));
    },
    [goTo, sectionCount],
  );

  useWheelStep({
    enabled: !isAccessible,
    isSpinning,
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
