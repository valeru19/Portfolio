import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import type { SectionId } from "@/shared/content";
import { useTheme } from "@/shared/theme";

import {
  ACCESSIBLE_CARD_TRANSITION_MS,
  ACCESSIBLE_WHEEL_STEP_LOCK_MS,
  ACCESSIBLE_WHEEL_THRESHOLD,
  MODE_TRANSITION_ENTER_MS,
  MODE_TRANSITION_EXIT_MS,
} from "../model/constants";
import { replaceSectionHash, sectionIndexFromHash } from "../lib/sectionHash";
import type { ModeTransitionPhase, SpiralNavigationValue } from "../model/navigationContext";
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
  const { isAccessible, setAccessible } = useAccessibleMode();
  const sectionCount = sectionIds.length;

  const initialFromHash =
    typeof window !== "undefined"
      ? (sectionIndexFromHash(window.location.hash, sectionIds) ?? 0)
      : 0;
  const [currentIndex, setCurrentIndex] = useState(initialFromHash);
  const [targetIndex, setTargetIndex] = useState(initialFromHash);
  const [isSpinning, setIsSpinning] = useState(false);
  const [modeTransitionPhase, setModeTransitionPhase] = useState<ModeTransitionPhase>("idle");
  const modeTransitionGenRef = useRef(0);
  const modeTimerRef = useRef(0);

  const spiralRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const currentIndexRef = useRef(initialFromHash);
  const targetIndexRef = useRef(initialFromHash);
  const pendingIndexRef = useRef(initialFromHash);
  const spinningFlagRef = useRef(false);
  const animateToRotationRef = useRef<(rotation: number) => Promise<void>>(async () => undefined);
  const animateToSectionRef = useRef<(index: number) => Promise<void>>(async () => undefined);
  const goToRef = useRef<(index: number) => void>(() => undefined);

  // Не перетирать currentIndexRef из стейта во время спина —
  // onProgress пишет индекс по кадру, а startTransition/стейт отстаёт.
  if (!spinningFlagRef.current) {
    currentIndexRef.current = currentIndex;
  }
  targetIndexRef.current = targetIndex;

  const cardBusyRef = useRef(false);
  const cardBusyTimerRef = useRef(0);

  const {
    panelsRef,
    applyColors,
    markActive,
    markAccessibleCards,
    clearScrollable,
    warmAround,
    prepareJump,
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
    // Синхронно: точка HUD = секция по углу, без отставания startTransition.
    if (currentIndexRef.current === index) return;
    currentIndexRef.current = index;
    setCurrentIndex(index);
  }, []);

  const onSettled = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      setCurrentIndex(index);

      const pending = clampSectionIndex(pendingIndexRef.current, sectionCount);
      if (pending !== index) {
        // Очередь намерений: едем дальше; HUD уже на фактической посадке.
        targetIndexRef.current = pending;
        spinningFlagRef.current = true;
        void animateToSectionRef.current(pending);
        return;
      }

      spinningFlagRef.current = false;
      targetIndexRef.current = index;
      pendingIndexRef.current = index;
      const sectionId = sectionIds[index];
      if (sectionId) replaceSectionHash(sectionId);
      startTransition(() => {
        setTargetIndex(index);
        setIsSpinning(false);
      });
    },
    [sectionCount, sectionIds],
  );

  const {
    rotationRef,
    spinningRef,
    paintSpiralTransform,
    buildSpiral,
    animateToRotation,
    animateToSection,
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
    prepareJump,
    settleActivePanel,
  });

  animateToRotationRef.current = animateToRotation;
  animateToSectionRef.current = animateToSection;

  const goTo = useCallback(
    (index: number) => {
      const next = clampSectionIndex(index, sectionCount);
      pendingIndexRef.current = next;
      targetIndexRef.current = next;

      if (isAccessible) {
        if (next === currentIndexRef.current && !cardBusyRef.current) {
          markAccessibleCards(next);
          return;
        }
        // Во время анимации карточки коалесцируем в pending — применим на land.
        if (cardBusyRef.current) {
          return;
        }
        currentIndexRef.current = next;
        setTargetIndex(next);
        setCurrentIndex(next);
        applyColors(next, true);
        markAccessibleCards(next);
        const sectionId = sectionIds[next];
        if (sectionId) replaceSectionHash(sectionId);

        if (!prefersReducedMotion()) {
          cardBusyRef.current = true;
          if (cardBusyTimerRef.current) window.clearTimeout(cardBusyTimerRef.current);
          cardBusyTimerRef.current = window.setTimeout(() => {
            cardBusyRef.current = false;
            cardBusyTimerRef.current = 0;
            const pending = clampSectionIndex(pendingIndexRef.current, sectionCount);
            if (pending !== currentIndexRef.current) {
              goToRef.current(pending);
            }
          }, ACCESSIBLE_CARD_TRANSITION_MS);
        }
        return;
      }

      // Пока идёт поворот — только pending (очередь). HUD ведёт onProgress по углу.
      if (spinningFlagRef.current || spinningRef.current) {
        return;
      }

      // Без setState на старте твина: targetIndex/isSpinning в React никто в UI
      // не читает на каждом кадре, а commit всего дерева давал подёргивание.
      spinningFlagRef.current = true;
      void animateToSection(next);
    },
    [
      animateToSection,
      applyColors,
      isAccessible,
      markAccessibleCards,
      sectionCount,
      sectionIds,
      spinningRef,
    ],
  );

  goToRef.current = goTo;

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
    () =>
      modeTransitionPhase !== "idle" ||
      spinningFlagRef.current ||
      spinningRef.current ||
      (isAccessible && cardBusyRef.current),
    [isAccessible, modeTransitionPhase, spinningRef],
  );

  const inputEnabled = modeTransitionPhase === "idle";

  useWheelStep({
    enabled: inputEnabled,
    getIsBusy,
    getActiveScrollBox,
    onStep,
    // Карточки: нативный overflow-скролл + один щелчок = шаг секции.
    nativePanelScroll: isAccessible,
    stepThreshold: isAccessible ? ACCESSIBLE_WHEEL_THRESHOLD : undefined,
    stepLockMs: isAccessible ? ACCESSIBLE_WHEEL_STEP_LOCK_MS : undefined,
  });
  useTouchStep({ enabled: inputEnabled, onStep });
  useKeyboardStep({ enabled: inputEnabled, onStep });

  useEffect(() => {
    applyColors(currentIndexRef.current, true);
  }, [theme, applyColors]);

  useEffect(() => {
    const stage = stageRef.current;
    return () => {
      if (cardBusyTimerRef.current) window.clearTimeout(cardBusyTimerRef.current);
      if (modeTimerRef.current) window.clearTimeout(modeTimerRef.current);
      modeTransitionGenRef.current += 1;
      stage?.removeAttribute("data-mode-phase");
      document.documentElement.classList.remove("is-mode-switching");
    };
  }, [stageRef]);

  const setStageModePhase = useCallback((phase: ModeTransitionPhase) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (phase === "idle") stage.removeAttribute("data-mode-phase");
    else stage.setAttribute("data-mode-phase", phase);
  }, []);

  const toggleAccessible = useCallback(() => {
    if (modeTransitionPhase !== "idle") return;

    const nextAccessible = !isAccessible;
    const gen = ++modeTransitionGenRef.current;
    if (modeTimerRef.current) {
      window.clearTimeout(modeTimerRef.current);
      modeTimerRef.current = 0;
    }

    document.documentElement.classList.add("is-mode-switching");
    spinningFlagRef.current = false;
    killMotion();

    const unlock = () => {
      if (gen !== modeTransitionGenRef.current) return;
      setStageModePhase("idle");
      setModeTransitionPhase("idle");
      document.documentElement.classList.remove("is-mode-switching");
      modeTimerRef.current = 0;
    };

    // Reduced motion: без fade, только глушим card transitions на 2 кадра.
    if (prefersReducedMotion()) {
      setAccessible(nextAccessible);
      setModeTransitionPhase("enter");
      requestAnimationFrame(() => {
        requestAnimationFrame(unlock);
      });
      return;
    }

    // Лёгкий fade сцены (data-mode-phase): exit → swap под opacity 0 → enter.
    // Без filter/morph/remount — иначе снова фризы.
    setStageModePhase("exit");
    setModeTransitionPhase("exit");
    modeTimerRef.current = window.setTimeout(() => {
      if (gen !== modeTransitionGenRef.current) return;
      setAccessible(nextAccessible);
      setStageModePhase("enter");
      setModeTransitionPhase("enter");
      modeTimerRef.current = window.setTimeout(unlock, MODE_TRANSITION_ENTER_MS);
    }, MODE_TRANSITION_EXIT_MS);
  }, [isAccessible, killMotion, modeTransitionPhase, setAccessible, setStageModePhase]);

  useSpiralDomEffects({
    isAccessible,
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
    markAccessibleCards,
    applyColors,
    settleActivePanel,
    setIsSpinning,
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
    modeTransitionPhase,
    goTo,
    goNext,
    goPrev,
    toggleAccessible,
    registerPanel,
    spiralRef,
    stageRef,
    currentIndexRef,
  };
}
