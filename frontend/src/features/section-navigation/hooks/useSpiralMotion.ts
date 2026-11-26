import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import {
  bakeAndAttachPanel,
  beginBakeOpacityTurn,
  endBakeOpacityTurn,
  setPanelBakeVisible,
} from "../lib/panelBake";
import { beginBlurTurnWaapi, endBlurTurnCrossfade } from "../lib/panelBlur";
import { loadGsap } from "../lib/loadGsap";
import {
  animationDurationMs,
  animationEase,
  applySpiralLayoutToPanels,
  paintSpiralElement,
  paintSpiralElementWithGsap,
} from "../lib/spiralTransform";
import { snapRotationToSection } from "../model/geometry";
import { PANEL_STATE_ATTR, setBlurTurnAttr, setPanelStateAttr } from "../model/panelStateAttrs";
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
  prepareJump: (destIndex: number) => Promise<void>;
  settleActivePanel: (forIndex?: number) => void;
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
  warmAround,
  prepareJump,
  settleActivePanel,
}: Options) {
  const rotationRef = useRef(0);
  const gsapRef = useRef<GsapLike | null>(null);
  const tweenRef = useRef<{ kill: () => void } | null>(null);
  const spinningRef = useRef(false);
  const motionGenRef = useRef(0);
  const settleRafRef = useRef(0);
  const warmIdleRef = useRef(0);
  const warmIdleKindRef = useRef<"timeout" | "idle">("timeout");
  const blurFromRef = useRef<HTMLElement | undefined>(undefined);
  const blurDestRef = useRef<HTMLElement | undefined>(undefined);
  const blurAnimRef = useRef<{ cancel: () => void } | null>(null);

  const clearBlurTurn = useCallback(() => {
    blurAnimRef.current?.cancel();
    blurAnimRef.current = null;
    endBlurTurnCrossfade(blurFromRef.current, blurDestRef.current);
    endBakeOpacityTurn(blurFromRef.current, blurDestRef.current);
    blurFromRef.current = undefined;
    blurDestRef.current = undefined;
  }, []);

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
        clearBlurTurn();
        // Near/far+reveal; без layout reads.
        markActive(index);
      };

      const runSettle = () => {
        setSpinning(false);
        paintSpiralTransform(snapped);
        applyColors(index);
        onSettled(index);
        // will-change / bakeVisible / scrollable / warm — не в кадре посадки.
        requestAnimationFrame(() => {
          panelsRef.current.forEach(({ section }) => {
            if (section.style.willChange) section.style.willChange = "";
            setPanelBakeVisible(section, false);
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
      clearBlurTurn,
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

      // Без kill/restart текущего твина снаружи: goTo коалесцирует pending.
      // Здесь kill только при явной новой цели из finishScroll→pending chain.
      const gen = ++motionGenRef.current;
      tweenRef.current?.kill();
      tweenRef.current = null;
      if (settleRafRef.current) {
        cancelAnimationFrame(settleRafRef.current);
        settleRafRef.current = 0;
      }
      clearBlurTurn();
      clearScrollable();

      const startR = rotationRef.current;
      const goingBack = snapped > startR;
      const distanceDeg = Math.abs(snapped - startR);
      const duration = animationDurationMs(distanceDeg, goingBack);

      const fromIdx = clampSectionIndex(Math.round(-startR / 90), sectionCount);
      const destIdx = clampSectionIndex(Math.round(-snapped / 90), sectionCount);
      const fromId = sectionIds[fromIdx];
      const destId = sectionIds[destIdx];
      const fromSection = fromId ? panelsRef.current.get(fromId)?.section : undefined;
      const destSection = destId ? panelsRef.current.get(destId)?.section : undefined;

      const longJump = distanceDeg > 95;
      const spinKind = longJump ? (goingBack ? "nasp" : "long") : "step";

      // Длинный ход: прогрев dest±1 ДО спина (1–2 кадра), без снятия far у всей спирали.
      if (longJump && !prefersReducedMotion()) {
        await prepareJump(destIdx);
        if (gen !== motionGenRef.current) return;
      }

      setSpinning(true, spinKind);

      // Stage-цвета сразу — transition на HUD/body/header.
      applyColors(destIdx);

      // will-change только from/dest.
      // Длинный ход: все mid = непрозрачный bake (0 live-эффектов); from/dest = opacity bake.
      sectionIds.forEach((id, i) => {
        const section = panelsRef.current.get(id)?.section;
        if (!section) return;
        const nearCore = i === fromIdx || i === destIdx;
        section.style.willChange = nearCore ? "transform" : "";
        if (longJump) {
          bakeAndAttachPanel(id, section);
          setPanelBakeVisible(section, true);
          setPanelStateAttr(section, PANEL_STATE_ATTR.far, !nearCore);
          setPanelStateAttr(section, PANEL_STATE_ATTR.frost, false);
          setPanelStateAttr(section, PANEL_STATE_ATTR.blurLite, false);
        }
      });

      if (prefersReducedMotion()) {
        if (gen !== motionGenRef.current) return;
        finishScroll(snapped);
        return;
      }

      if (fromIdx !== destIdx) {
        blurFromRef.current = fromSection;
        blurDestRef.current = destSection;
        if (longJump) {
          if (fromSection) setBlurTurnAttr(fromSection, "from");
          if (destSection) setBlurTurnAttr(destSection, "dest");
          blurAnimRef.current = beginBakeOpacityTurn(fromSection, destSection, duration);
        } else {
          blurAnimRef.current = beginBlurTurnWaapi(fromSection, destSection, duration);
        }
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

        tweenRef.current = gsap.to(state, {
          r: snapped,
          duration,
          ease,
          overwrite: true,
          onUpdate: () => {
            if (gen !== motionGenRef.current) return;
            // Только transform спирали — без layout reads / filter.
            paintSpiralElementWithGsap(gsap, spiral, state.r);
            rotationRef.current = state.r;
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
      clearBlurTurn,
      clearScrollable,
      ensureGsap,
      finishScroll,
      isAccessible,
      panelsRef,
      prepareJump,
      sectionCount,
      sectionIds,
      setSpinning,
      spiralRef,
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
    cancelWarm();
    clearBlurTurn();
    setSpinning(false);
  }, [cancelWarm, clearBlurTurn, setSpinning]);

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
