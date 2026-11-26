import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { loadGsap } from "../lib/loadGsap";
import {
  beginPanelViewTurn,
  bumpPanelViewGeneration,
  prepareSharpUnderCover,
} from "../lib/panelViewController";
import {
  animationDurationMs,
  animationEase,
  applySpiralLayoutToPanels,
  paintSpiralElement,
  paintSpiralElementWithGsap,
} from "../lib/spiralTransform";
import { rotationForSectionIndex, snapRotationToSection } from "../model/geometry";
import { setBlurTurnAttr } from "../model/panelStateAttrs";
import { prefersReducedMotion } from "../model/prefersReducedMotion";
import { planMoveFromSection } from "../model/ringNavigation";
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
  prepareJump: (fromIndex: number, destIndex: number, goingBack?: boolean) => Promise<void>;
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
  prepareJump,
  settleActivePanel,
}: Options) {
  const lastProgressIdxRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const gsapRef = useRef<GsapLike | null>(null);
  const tweenRef = useRef<{ kill: () => void } | null>(null);
  const spinningRef = useRef(false);
  const motionGenRef = useRef(0);
  const settleRafRef = useRef(0);
  const warmIdleRef = useRef(0);
  const warmIdleKindRef = useRef<"timeout" | "idle">("timeout");
  const viewTurnCancelRef = useRef<(() => void) | null>(null);

  /** Прерывание хода: отмена отложенных шагов вида + сброс маркеров. */
  const abortViewTurn = useCallback(() => {
    viewTurnCancelRef.current?.();
    viewTurnCancelRef.current = null;
    panelsRef.current.forEach(({ section }) => {
      setBlurTurnAttr(section, null);
    });
  }, [panelsRef]);

  /** Посадка: только маркеры. Не трогаем gen — fade cover dest+1 должен доиграть. */
  const clearBlurTurnAttrs = useCallback(() => {
    viewTurnCancelRef.current = null;
    panelsRef.current.forEach(({ section }) => {
      setBlurTurnAttr(section, null);
    });
  }, [panelsRef]);

  const setSpinning = useCallback((on: boolean, kind?: "step" | "nasp" | "long") => {
    spinningRef.current = on;
    document.body.classList.toggle("is-spinning", on);
    document.body.classList.remove("is-spinning-back");
    if (on && kind) document.body.dataset.spinKind = kind;
    else delete document.body.dataset.spinKind;
  }, []);

  const cancelWarm = useCallback(() => {
    if (!warmIdleRef.current) return;
    if (warmIdleKindRef.current === "idle" && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(warmIdleRef.current);
    } else {
      window.clearTimeout(warmIdleRef.current);
    }
    warmIdleRef.current = 0;
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
      cancelWarm();
      const run = () => {
        warmIdleRef.current = 0;
        warmAround(index);
      };
      if (typeof window.requestIdleCallback === "function") {
        warmIdleKindRef.current = "idle";
        warmIdleRef.current = window.requestIdleCallback(run, { timeout: 200 });
        return;
      }
      warmIdleKindRef.current = "timeout";
      warmIdleRef.current = window.setTimeout(run, 48);
    },
    [cancelWarm, warmAround],
  );

  const finishScroll = useCallback(
    (targetRotation: number) => {
      const snapped = snapRotationToSection(targetRotation, sectionCount);
      const index = clampSectionIndex(Math.round(-snapped / 90), sectionCount);

      paintSpiralTransform(snapped);

      const runPanelAttrs = () => {
        clearBlurTurnAttrs();
        markActive(index);
      };

      const runSettle = () => {
        setSpinning(false);
        paintSpiralTransform(snapped);
        applyColors(index);
        onSettled(index);
        requestAnimationFrame(() => {
          panelsRef.current.forEach(({ section }) => {
            if (section.style.willChange) section.style.willChange = "";
            setBlurTurnAttr(section, null);
          });
          const idle = () => {
            scheduleWarm(index);
            settleActivePanel(index);
          };
          if (typeof window.requestIdleCallback === "function") {
            window.requestIdleCallback(idle, { timeout: 120 });
          } else {
            window.setTimeout(idle, 32);
          }
        });
      };

      if (settleRafRef.current) cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = requestAnimationFrame(() => {
        runPanelAttrs();
        settleRafRef.current = requestAnimationFrame(runSettle);
      });
    },
    [
      applyColors,
      clearBlurTurnAttrs,
      markActive,
      onSettled,
      paintSpiralTransform,
      panelsRef,
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
      abortViewTurn();
      clearScrollable();

      const startR = rotationRef.current;
      const goingBack = snapped > startR;
      const distanceDeg = Math.abs(snapped - startR);
      const duration = animationDurationMs(distanceDeg, goingBack);

      const fromIdx = clampSectionIndex(Math.round(-startR / 90), sectionCount);
      const destIdx = clampSectionIndex(Math.round(-snapped / 90), sectionCount);

      const longJump = distanceDeg > 95;
      const spinKind = longJump ? (goingBack ? "nasp" : "long") : "step";

      if (longJump && !prefersReducedMotion()) {
        await prepareJump(fromIdx, destIdx, goingBack);
        if (gen !== motionGenRef.current) return;
      }

      setSpinning(true, spinKind);
      // На длинном reverse не гоняем stage-color transition весь ход —
      // это полный перекрас экрана на каждом кадре + и так тяжёлый scale-up.
      // Цвет применится в finishScroll. Вперёд / шаг — как раньше.
      if (!(longJump && goingBack)) {
        applyColors(destIdx);
      }

      // will-change только from/dest; на nasp — ни у кого (меньше layer thrash).
      sectionIds.forEach((id, i) => {
        const section = panelsRef.current.get(id)?.section;
        if (!section) return;
        if (longJump && goingBack) {
          section.style.willChange = "";
          return;
        }
        const nearCore = i === fromIdx || i === destIdx;
        section.style.willChange = nearCore ? "transform" : "";
      });

      if (prefersReducedMotion()) {
        if (gen !== motionGenRef.current) return;
        finishScroll(snapped);
        return;
      }

      if (fromIdx !== destIdx) {
        const byIndex = new Map<number, PanelNodes>();
        sectionIds.forEach((id, i) => {
          const nodes = panelsRef.current.get(id);
          if (nodes) byIndex.set(i, nodes);
        });
        const fromSection = byIndex.get(fromIdx)?.section;
        const destSection = byIndex.get(destIdx)?.section;
        if (fromSection) setBlurTurnAttr(fromSection, "from");
        if (destSection) setBlurTurnAttr(destSection, "dest");
        const turn = beginPanelViewTurn({
          fromIdx,
          destIdx,
          sectionCount,
          longJump,
          goingBack,
          durationSec: duration,
          panels: byIndex,
        });
        viewTurnCancelRef.current = turn.cancel;
      }

      const runTween = (gsap: NonNullable<GsapLike>) => {
        if (gen !== motionGenRef.current) return;
        const spiral = spiralRef.current;
        if (!spiral) {
          finishScroll(snapped);
          return;
        }
        const state = { r: startR };
        const ease = animationEase(distanceDeg, goingBack);
        lastProgressIdxRef.current = null;

        tweenRef.current = gsap.to(state, {
          r: snapped,
          duration,
          ease,
          overwrite: true,
          onUpdate: () => {
            if (gen !== motionGenRef.current) return;
            paintSpiralElementWithGsap(gsap, spiral, state.r);
            rotationRef.current = state.r;
            const idx = clampSectionIndex(Math.round(-state.r / 90), sectionCount);
            if (lastProgressIdxRef.current !== idx) {
              lastProgressIdxRef.current = idx;
              onProgress?.(idx);
            }
          },
          onComplete: () => {
            if (gen !== motionGenRef.current) return;
            tweenRef.current = null;
            finishScroll(snapped);
          },
        });
      };

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
      applyColors,
      abortViewTurn,
      clearScrollable,
      ensureGsap,
      finishScroll,
      isAccessible,
      onProgress,
      panelsRef,
      prepareJump,
      sectionCount,
      sectionIds,
      setSpinning,
      spiralRef,
    ],
  );

  /**
   * Вперёд через край круга: dest временно в слоте from+steps,
   * промежуточные скрыты; после посадки — rebase layout и rotation.
   */
  const animateRingWrap = useCallback(
    async (fromIdx: number, destIdx: number, steps: number) => {
      if (isAccessible || steps <= 0) return;
      const gen = ++motionGenRef.current;
      tweenRef.current?.kill();
      tweenRef.current = null;
      if (settleRafRef.current) {
        cancelAnimationFrame(settleRafRef.current);
        settleRafRef.current = 0;
      }
      abortViewTurn();
      clearScrollable();

      const startR = rotationRef.current;
      const endR = startR - steps * 90;
      const distanceDeg = Math.abs(endR - startR);
      const duration = animationDurationMs(distanceDeg, false);
      const destId = sectionIds[destIdx];
      const spiral = spiralRef.current;

      const layoutIndexById = new Map<SectionId, number>();
      sectionIds.forEach((id, i) => layoutIndexById.set(id, i));
      if (destId) layoutIndexById.set(destId, fromIdx + steps);

      if (spiral) {
        applySpiralLayoutToPanels(
          spiral,
          sectionIds,
          panelsRef.current,
          gsapRef.current,
          layoutIndexById,
        );
      }

      // Скрыть всё, кроме from и dest — без мелькания промежуточных.
      sectionIds.forEach((id, i) => {
        const section = panelsRef.current.get(id)?.section;
        if (!section) return;
        if (i === fromIdx || i === destIdx) {
          section.style.opacity = "1";
          section.style.visibility = "visible";
          section.style.willChange = "transform";
          return;
        }
        section.style.opacity = "0";
        section.style.visibility = "hidden";
        section.style.willChange = "";
      });

      // Только dest: без dest+1 (промежуточные скрыты; blur after land).
      if (!prefersReducedMotion()) {
        const destNodes = destId ? panelsRef.current.get(destId) : undefined;
        if (destNodes) await prepareSharpUnderCover(destNodes);
        if (gen !== motionGenRef.current) return;
      }

      setSpinning(true, destIdx === 0 ? "nasp" : "long");
      applyColors(destIdx);
      // HUD сразу на dest: во время wrap слот за краем, round(rotation) врёт.
      onProgress?.(destIdx);

      if (prefersReducedMotion()) {
        if (gen !== motionGenRef.current) return;
        sectionIds.forEach((id) => {
          const section = panelsRef.current.get(id)?.section;
          if (!section) return;
          section.style.opacity = "1";
          section.style.visibility = "visible";
        });
        if (spiral) {
          applySpiralLayoutToPanels(spiral, sectionIds, panelsRef.current, gsapRef.current);
        }
        finishScroll(rotationForSectionIndex(destIdx));
        return;
      }

      const byIndex = new Map<number, PanelNodes>();
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (nodes) byIndex.set(i, nodes);
      });
      const fromSection = byIndex.get(fromIdx)?.section;
      const destSection = byIndex.get(destIdx)?.section;
      if (fromSection) setBlurTurnAttr(fromSection, "from");
      if (destSection) setBlurTurnAttr(destSection, "dest");
      const turn = beginPanelViewTurn({
        fromIdx,
        destIdx,
        sectionCount,
        longJump: steps > 1,
        goingBack: false,
        durationSec: duration,
        panels: byIndex,
        wrapsRing: true,
      });
      viewTurnCancelRef.current = turn.cancel;

      const restoreAndFinish = () => {
        sectionIds.forEach((id) => {
          const section = panelsRef.current.get(id)?.section;
          if (!section) return;
          section.style.opacity = "1";
          section.style.visibility = "visible";
          section.style.willChange = "";
        });
        const sp = spiralRef.current;
        if (sp) {
          applySpiralLayoutToPanels(sp, sectionIds, panelsRef.current, gsapRef.current);
        }
        finishScroll(rotationForSectionIndex(destIdx));
      };

      const runTween = (gsap: NonNullable<GsapLike>) => {
        if (gen !== motionGenRef.current) return;
        const sp = spiralRef.current;
        if (!sp) {
          restoreAndFinish();
          return;
        }
        const state = { r: startR };
        const ease = animationEase(distanceDeg, false);
        tweenRef.current = gsap.to(state, {
          r: endR,
          duration,
          ease,
          overwrite: true,
          onUpdate: () => {
            if (gen !== motionGenRef.current) return;
            paintSpiralElementWithGsap(gsap, sp, state.r);
            rotationRef.current = state.r;
          },
          onComplete: () => {
            if (gen !== motionGenRef.current) return;
            tweenRef.current = null;
            restoreAndFinish();
          },
        });
      };

      if (gsapRef.current) {
        runTween(gsapRef.current);
        return;
      }
      const gsap = await ensureGsap();
      if (gen !== motionGenRef.current) return;
      if (!gsap) {
        restoreAndFinish();
        return;
      }
      runTween(gsap);
    },
    [
      abortViewTurn,
      applyColors,
      clearScrollable,
      ensureGsap,
      finishScroll,
      isAccessible,
      onProgress,
      panelsRef,
      sectionCount,
      sectionIds,
      setSpinning,
      spiralRef,
    ],
  );

  /** goTo через planMove: wrap / forward / back. */
  const animateToSection = useCallback(
    async (targetIndex: number) => {
      if (isAccessible) return;
      const fromIdx = clampSectionIndex(Math.round(-rotationRef.current / 90), sectionCount);
      const plan = planMoveFromSection(fromIdx, targetIndex, sectionCount);
      if (plan.direction === "noop") {
        if (!spinningRef.current) finishScroll(rotationForSectionIndex(fromIdx));
        return;
      }
      if (plan.wrapsRing) {
        await animateRingWrap(fromIdx, plan.targetSection, plan.steps);
        return;
      }
      await animateToRotation(rotationForSectionIndex(plan.targetSection));
    },
    [animateRingWrap, animateToRotation, finishScroll, isAccessible, sectionCount],
  );

  const killMotion = useCallback(() => {
    motionGenRef.current += 1;
    bumpPanelViewGeneration();
    tweenRef.current?.kill();
    tweenRef.current = null;
    if (settleRafRef.current) {
      cancelAnimationFrame(settleRafRef.current);
      settleRafRef.current = 0;
    }
    cancelWarm();
    abortViewTurn();
    setSpinning(false);
    // На случай убитого wrap — вернуть видимость панелей.
    panelsRef.current.forEach(({ section }) => {
      if (section.style.visibility === "hidden") section.style.visibility = "visible";
      if (section.style.opacity === "0") section.style.opacity = "1";
    });
    const spiral = spiralRef.current;
    if (spiral && !isAccessible) {
      applySpiralLayoutToPanels(spiral, sectionIds, panelsRef.current, gsapRef.current);
    }
  }, [abortViewTurn, cancelWarm, isAccessible, panelsRef, sectionIds, setSpinning, spiralRef]);

  return {
    rotationRef,
    spinningRef,
    paintSpiralTransform,
    buildSpiral,
    animateToRotation,
    animateToSection,
    ensureGsap,
    killMotion,
  };
}
