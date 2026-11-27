import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { withStageBgTransitionDisabled } from "../lib/applyPaletteToDocument";
import {
  cancelEdgeSpringAnimation,
  playEdgeSpringAnimation,
  type EdgeSpringController,
} from "../lib/edgeSpring";
import { loadGsap } from "../lib/loadGsap";
import {
  beginPanelViewTurn,
  bumpPanelViewGeneration,
  prepareRingWrapViews,
} from "../lib/panelViewController";
import { runSpiralRotationTween, type GsapLike } from "../lib/spiralMotionTween";
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
  const edgeSpringRef = useRef<EdgeSpringController>({ anim: null, busy: false });

  const cancelEdgeSpring = useCallback(() => {
    cancelEdgeSpringAnimation(edgeSpringRef.current, spiralRef.current, rotationRef.current);
  }, [spiralRef]);

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
    // Холодный layout без GSAP — та же поза, что после canonical land.
    applySpiralLayoutToPanels(spiral, sectionIds, panelsRef.current, null);
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

      // Посадка = cold: только CSS transform. GSAP clearProps + без gsap.set на
      // раскладке/позе — иначе style.transform уходит в skew(360deg) и ломает
      // pixel-compare с первой загрузкой.
      const spiral = spiralRef.current;
      if (spiral && gsapRef.current) {
        gsapRef.current.set(spiral, { clearProps: "transform" });
      }
      resetSpiralPaintCache();
      paintSpiralTransform(snapped);
      if (spiral) {
        applySpiralLayoutToPanels(spiral, sectionIds, panelsRef.current, null);
      }

      const runPanelAttrs = () => {
        clearBlurTurnAttrs();
        markActive(index);
      };

      const runSettle = () => {
        setSpinning(false);
        if (spiral && gsapRef.current) {
          gsapRef.current.set(spiral, { clearProps: "transform" });
        }
        resetSpiralPaintCache();
        paintSpiralTransform(snapped);
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

  /** Пружина на последней секции: только transform спирали (WAAPI). */
  const playEdgeSpring = useCallback(() => {
    if (isAccessible || prefersReducedMotion()) return;
    if (spinningRef.current || edgeSpringRef.current.busy) return;
    const spiral = spiralRef.current;
    if (!spiral) return;
    const baseR = rotationRef.current;
    playEdgeSpringAnimation({
      spiral,
      baseRotation: baseR,
      controller: edgeSpringRef.current,
      clearGsapTransform: (el) => {
        gsapRef.current?.set(el, { clearProps: "transform" });
      },
    });
  }, [isAccessible, spiralRef]);

  const animateToRotation = useCallback(
    async (targetRotation: number) => {
      if (isAccessible) return;
      cancelEdgeSpring();
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

      // Спин сразу: prep dest не блокирует старт (иначе «Наверх» = пауза + рывок).
      setSpinning(true, spinKind);
      if (longJump && !prefersReducedMotion()) {
        void prepareJump(fromIdx, destIdx, goingBack);
      }
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
        const spiral = spiralRef.current;
        if (!spiral) {
          finishScroll(snapped);
          return;
        }
        lastProgressIdxRef.current = null;
        runSpiralRotationTween({
          gsap,
          spiral,
          startR,
          endR: snapped,
          duration,
          ease: animationEase(distanceDeg, goingBack),
          refs: {
            motionGen: gen,
            isCurrent: () => gen === motionGenRef.current,
            setTween: (tween) => {
              tweenRef.current = tween;
            },
            setRotation: (r) => {
              rotationRef.current = r;
            },
          },
          onFrame: (r) => {
            const idx = clampSectionIndex(Math.round(-r / 90), sectionCount);
            if (lastProgressIdxRef.current !== idx) {
              lastProgressIdxRef.current = idx;
              onProgress?.(idx);
            }
          },
          nearLand:
            longJump && onNearLand
              ? { remainingDeg: LONG_JUMP_REVEAL_REMAINING_DEG, run: onNearLand }
              : undefined,
          onComplete: () => finishScroll(snapped),
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
      cancelEdgeSpring,
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
      cancelEdgeSpring();
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

      if (prefersReducedMotion()) {
        if (gen !== motionGenRef.current) return;
        finishScroll(rotationForSectionIndex(destIdx), { instantStageColor: true });
        return;
      }

      // Спин сразу — prep под cover не блокирует старт поворота.
      setSpinning(true, destIdx === 0 ? "nasp" : "long");
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
        // null gsap: не трогаем spiral transformOrigin через gsap.set перед твином.
        applySpiralLayoutToPanels(spiral, sectionIds, panelsRef.current, null, layoutIndexById);
      }

      const fromSection = panelsRef.current.get(sectionIds[fromIdx] ?? "")?.section;
      const destSection = destId ? panelsRef.current.get(destId)?.section : undefined;
      // Без will-change на панелях: на wrap с #contacts слой thrash (RasterTask × layer 25/27).

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
        // Один кадр: R и слоты как при первой загрузке на dest.
        finishScroll(rotationForSectionIndex(destIdx), { instantStageColor: true });
      };

      const span = startR - endR || 1;
      const runTween = (gsap: NonNullable<GsapLike>) => {
        const sp = spiralRef.current;
        if (!sp) {
          landCanonical();
          return;
        }
        runSpiralRotationTween({
          gsap,
          spiral: sp,
          startR,
          endR,
          duration,
          ease: animationEase(distanceDeg, false),
          refs: {
            motionGen: gen,
            isCurrent: () => gen === motionGenRef.current,
            setTween: (tween) => {
              tweenRef.current = tween;
            },
            setRotation: (r) => {
              rotationRef.current = r;
            },
          },
          onFrame: (r) => {
            const t = (startR - r) / span;
            if (t >= 0.5 && lastProgressIdxRef.current !== destIdx) {
              lastProgressIdxRef.current = destIdx;
              onProgress?.(destIdx);
            }
          },
          nearLand: onNearLand ? { remainingDeg: revealDeg, run: onNearLand } : undefined,
          onComplete: landCanonical,
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
      cancelEdgeSpring,
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
      cancelEdgeSpring();
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
    [
      animateRingWrap,
      animateToRotation,
      cancelEdgeSpring,
      finishScroll,
      isAccessible,
      sectionCount,
    ],
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
    cancelEdgeSpring();
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
  }, [
    abortViewTurn,
    cancelEdgeSpring,
    cancelWarm,
    isAccessible,
    panelsRef,
    sectionIds,
    setSpinning,
    spiralRef,
  ]);

  return {
    rotationRef,
    spinningRef,
    edgeSpringRef,
    paintSpiralTransform,
    buildSpiral,
    animateToRotation,
    animateToSection,
    playEdgeSpring,
    cancelEdgeSpring,
    ensureGsap,
    killMotion,
  };
}
