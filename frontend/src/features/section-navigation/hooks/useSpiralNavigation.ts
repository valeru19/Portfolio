import { useCallback, useEffect, useRef, useState } from "react";

import type { SectionId } from "@/shared/content";
import { sectionPaletteAt } from "@/shared/content/sectionPalettes";
import { useTheme } from "@/shared/theme";

import { applyPaletteToDocument } from "../lib/applyPaletteToDocument";
import { rotationForSectionIndex } from "../model/geometry";
import type { SpiralNavigationValue } from "../model/navigationContext";
import { prefersReducedMotion } from "../model/prefersReducedMotion";
import { clampSectionIndex, stepSectionIndex } from "../model/sectionIndex";

import { useAccessibleMode } from "./useAccessibleMode";
import { useKeyboardStep } from "./useKeyboardStep";
import { useSpiralDomEffects } from "./useSpiralDomEffects";
import { useSpiralMotion } from "./useSpiralMotion";
import { useTouchStep } from "./useTouchStep";
import { useWheelStep } from "./useWheelStep";

type PanelNodes = {
  section: HTMLElement;
  scroll: HTMLElement;
};

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
  const panelsRef = useRef<Map<SectionId, PanelNodes>>(new Map());
  const paintedIndexRef = useRef(-1);
  const settleTimerRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);
  const targetIndexRef = useRef(0);
  const spinningFlagRef = useRef(false);

  currentIndexRef.current = currentIndex;
  targetIndexRef.current = targetIndex;

  const applyColors = useCallback(
    (index: number, force = false) => {
      if (!force && index === paintedIndexRef.current) return;
      paintedIndexRef.current = index;
      const id = sectionIds[index] ?? "hero";
      applyPaletteToDocument(sectionPaletteAt(theme, index), id);
    },
    [sectionIds, theme],
  );

  const markActive = useCallback(
    (index: number) => {
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        nodes.section.classList.toggle("active", isOn);
        nodes.section.classList.toggle("is-far", !isOn && (i < index - 1 || i > index + 2));
        nodes.section.style.opacity = "1";
        nodes.section.style.visibility = "visible";
      });
    },
    [sectionIds],
  );

  const clearScrollable = useCallback(() => {
    panelsRef.current.forEach(({ scroll }) => {
      scroll.classList.remove("is-scrollable");
      scroll.style.overflow = "";
      scroll.scrollTop = 0;
    });
  }, []);

  const settleActivePanel = useCallback(() => {
    if (isAccessible) return;
    const idx = currentIndexRef.current;
    panelsRef.current.forEach(({ scroll }, id) => {
      scroll.classList.remove("is-scrollable");
      if (sectionIds.indexOf(id) !== idx) scroll.scrollTop = 0;
    });
    const activeId = sectionIds[idx];
    const active = activeId ? panelsRef.current.get(activeId) : undefined;
    if (!active) return;
    if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      if (isAccessible || spinningFlagRef.current || currentIndexRef.current !== idx) return;
      if (active.scroll.scrollHeight > active.scroll.clientHeight + 2) {
        active.scroll.classList.add("is-scrollable");
      }
    }, 90);
  }, [isAccessible, sectionIds]);

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
    [animateToRotation, applyColors, isAccessible, sectionCount, sectionIds],
  );

  const goNext = useCallback(() => {
    goTo(stepSectionIndex(targetIndexRef.current, 1, sectionCount));
  }, [goTo, sectionCount]);

  const goPrev = useCallback(() => {
    goTo(stepSectionIndex(targetIndexRef.current, -1, sectionCount));
  }, [goTo, sectionCount]);

  const registerPanel = useCallback(
    (id: SectionId, sectionEl: HTMLElement, scrollEl: HTMLElement) => {
      panelsRef.current.set(id, { section: sectionEl, scroll: scrollEl });
      return () => {
        panelsRef.current.delete(id);
      };
    },
    [],
  );

  const getActiveScrollBox = useCallback(() => {
    const idx = spinningRef.current ? targetIndexRef.current : currentIndexRef.current;
    const id = sectionIds[idx];
    return id ? (panelsRef.current.get(id)?.scroll ?? null) : null;
  }, [sectionIds, spinningRef]);

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
