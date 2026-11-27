import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { withStageBgTransitionDisabled } from "../lib/applyPaletteToDocument";
import { loadGsap } from "../lib/loadGsap";
import {
  beginPanelViewTurn,
  bumpPanelViewGeneration,
  prepareRingWrapViews,
} from "../lib/panelViewController";
import {
  animationDurationMs,
  animationEase,
  applySpiralLayoutToPanels,
  paintSpiralElement,
  paintSpiralElementWithGsap,
  resetSpiralPaintCache,
} from "../lib/spiralTransform";
import { LONG_JUMP_REVEAL_REMAINING_DEG } from "../model/constants";
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
    (targetRotation: number, opts?: { instantStageColor?: boolean }) => {
      const snapped = snapRotationToSection(targetRotation, sectionCount);
      const index = clampSectionIndex(Math.round(-snapped / 90), sectionCount);

      // Посадка: CSS transform (как при первой загрузке). clearProps — иначе GSAP
      // оставляет свой matrix, и style.transform не совпадает с cold start.
      const spiral = spiralRef.current;
      if (spiral && gsapRef.current) {
        gsapRef.current.set(spiral, { clearProps: "transform" });
      }
      resetSpiralPaintCache();
      paintSpiralTransform(snapped);
      if (spiral) {
        applySpiralLayoutToPanels(spiral, sectionIds, panelsRef.current, gsapRef.current);
      }

      const runPanelAttrs = () => {
        clearBlurTurnAttrs();
        markActive(index);
      };

      const runSettle = () => {
        setSpinning(false);
        if (spiral && gsapRef.current) {
          paintSpiralElementWithGsap(gsapRef.current, spiral, snapped);
          rotationRef.current = snapped;
        } else {
          paintSpiralTransform(snapped);
        }
        if (opts?.instantStageColor) {
          withStageBgTransitionDisabled(() => applyColors(index));
        } else {
          applyColors(index);
        }
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
      sectionIds,
      setSpinning,
      settleActivePanel,
      spiralRef,
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

      let onNearLand: (() => void) | undefined;
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
        onNearLand = turn.onNearLand;
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
        let nearLandDone = false;

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
            if (longJump && onNearLand && !nearLandDone) {
              const remaining = Math.abs(snapped - state.r);
              if (remaining <= LONG_JUMP_REVEAL_REMAINING_DEG) {
                nearLandDone = true;
                onNearLand();
              }
            }
          },
          onComplete: () => {
            if (gen !== motionGenRef.current) return;
            tweenRef.current = null;
            if (longJump && onNearLand && !nearLandDone) {
              nearLandDone = true;
              onNearLand();
            }
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
   * Ход через круг: dest и next под cover до старта, во время полёта в слотах
   * from+steps / from+steps+1; на посадке — canonical R и слоты (как первая загрузка).
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
      const nextBlurIdx = destIdx + 1 < sectionCount ? destIdx + 1 : -1;
      const nextId = nextBlurIdx >= 0 ? sectionIds[nextBlurIdx] : undefined;
      const spiral = spiralRef.current;
      const destSlot = fromIdx + steps;

      const byIndex = new Map<number, PanelNodes>();
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (nodes) byIndex.set(i, nodes);
      });

      if (!prefersReducedMotion()) {
        await prepareRingWrapViews(byIndex, destIdx, sectionCount);
        if (gen !== motionGenRef.current) return;
      }

      // Временные слоты полёта: dest и next впереди; остальные — свои индексы (solid).
      if (destId && spiral) {
        const layoutIndexById = new Map<SectionId, number>();
        sectionIds.forEach((id, i) => layoutIndexById.set(id, i));
        layoutIndexById.set(destId, destSlot);
        if (nextId) layoutIndexById.set(nextId, destSlot + 1);
        applySpiralLayoutToPanels(
          spiral,
          sectionIds,
          panelsRef.current,
          gsapRef.current,
          layoutIndexById,
        );
      }

      const fromSection = panelsRef.current.get(sectionIds[fromIdx] ?? "")?.section;
      const destSection = destId ? panelsRef.current.get(destId)?.section : undefined;
      if (fromSection) fromSection.style.willChange = "transform";
      if (destSection) destSection.style.willChange = "transform";

      if (prefersReducedMotion()) {
        if (gen !== motionGenRef.current) return;
        finishScroll(rotationForSectionIndex(destIdx), { instantStageColor: true });
        return;
      }

      setSpinning(true, destIdx === 0 ? "nasp" : "long");
      applyColors(destIdx);
      lastProgressIdxRef.current = fromIdx;

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
      const onNearLand = turn.onNearLand;
      // 1-шаговый wrap: reveal ближе к концу (иначе remaining≤90 срабатывает сразу).
      const revealDeg =
        steps > 1 ? LONG_JUMP_REVEAL_REMAINING_DEG : Math.min(24, LONG_JUMP_REVEAL_REMAINING_DEG);

      const landCanonical = () => {
        sectionIds.forEach((id) => {
          const section = panelsRef.current.get(id)?.section;
          if (section?.style.willChange) section.style.willChange = "";
        });
        // Один кадр: R и слоты как при первой загрузке на dest.
        finishScroll(rotationForSectionIndex(destIdx), { instantStageColor: true });
      };

      const runTween = (gsap: NonNullable<GsapLike>) => {
        if (gen !== motionGenRef.current) return;
        const sp = spiralRef.current;
        if (!sp) {
          landCanonical();
          return;
        }
        const state = { r: startR };
        const ease = animationEase(distanceDeg, false);
        const span = startR - endR || 1;
        let nearLandDone = false;
        tweenRef.current = gsap.to(state, {
          r: endR,
          duration,
          ease,
          overwrite: true,
          onUpdate: () => {
            if (gen !== motionGenRef.current) return;
            paintSpiralElementWithGsap(gsap, sp, state.r);
            rotationRef.current = state.r;
            const t = (startR - state.r) / span;
            if (t >= 0.5 && lastProgressIdxRef.current !== destIdx) {
              lastProgressIdxRef.current = destIdx;
              onProgress?.(destIdx);
            }
            if (onNearLand && !nearLandDone) {
              const remaining = Math.abs(endR - state.r);
              if (remaining <= revealDeg) {
                nearLandDone = true;
                onNearLand();
              }
            }
          },
          onComplete: () => {
            if (gen !== motionGenRef.current) return;
            tweenRef.current = null;
            if (onNearLand && !nearLandDone) {
              nearLandDone = true;
              onNearLand();
            }
            landCanonical();
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
        landCanonical();
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
    rotationRef.current = 0;
    // На случай убитого wrap — вернуть видимость панелей.
    panelsRef.current.forEach(({ section }) => {
      if (section.style.visibility === "hidden") section.style.visibility = "visible";
      if (section.style.opacity === "0") section.style.opacity = "1";
    });
    const spiral = spiralRef.current;
    if (spiral && !isAccessible) {
      if (gsapRef.current) {
        paintSpiralElementWithGsap(gsapRef.current, spiral, 0);
      } else {
        paintSpiralElement(spiral, 0);
      }
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
