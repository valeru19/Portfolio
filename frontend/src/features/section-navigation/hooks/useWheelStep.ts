import { useEffect, useRef } from "react";

import {
  PANEL_SCROLL_LERP,
  PANEL_WHEEL_SCROLL_FACTOR,
  WHEEL_ACC_DECAY_MS,
  WHEEL_STEP_LOCK_MS,
  WHEEL_THRESHOLD,
} from "../model/constants";
import {
  lerpScrollTop,
  nextScrollTopAfterWheel,
  normalizeWheelDeltaY,
  panelAtScrollEdge,
  panelCanConsumeWheel,
  type ScrollBoxMetrics,
} from "../model/panelScroll";
import { PANEL_STATE_ATTR } from "../model/panelStateAttrs";
import {
  INITIAL_WHEEL_LOCK_STATE,
  clearWheelAccumulation,
  reduceWheelStep,
  type WheelLockState,
} from "../model/wheelLock";

type Options = {
  enabled: boolean;
  /** Лучше getter через ref — слушатель не пересоздаётся на каждый spin. */
  getIsBusy: () => boolean;
  getActiveScrollBox: () => HTMLElement | null;
  onStep: (direction: 1 | -1) => void;
  /**
   * Карточки без CSS-transform на scroll-box: отдаём wheel браузеру.
   * Спираль (transform) — крутим scrollTop сами.
   */
  nativePanelScroll?: boolean;
  /** Порог/lock шага секции (accessible мягче спирали). */
  stepThreshold?: number;
  stepLockMs?: number;
};

function metricsFromElement(
  el: HTMLElement | null,
  scrollTopOverride?: number,
): ScrollBoxMetrics | null {
  if (!el) return null;
  return {
    scrollTop: scrollTopOverride ?? el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollableAttr: el.hasAttribute(PANEL_STATE_ATTR.scrollable),
  };
}

export function useWheelStep({
  enabled,
  getIsBusy,
  getActiveScrollBox,
  onStep,
  nativePanelScroll = false,
  stepThreshold = WHEEL_THRESHOLD,
  stepLockMs = WHEEL_STEP_LOCK_MS,
}: Options): void {
  const stateRef = useRef<WheelLockState>(INITIAL_WHEEL_LOCK_STATE);
  const decayTimerRef = useRef<number | null>(null);
  const onStepRef = useRef(onStep);
  const getIsBusyRef = useRef(getIsBusy);
  const getActiveScrollBoxRef = useRef(getActiveScrollBox);
  const nativePanelScrollRef = useRef(nativePanelScroll);
  const stepThresholdRef = useRef(stepThreshold);
  const stepLockMsRef = useRef(stepLockMs);
  const targetScrollRef = useRef<number | null>(null);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  onStepRef.current = onStep;
  getIsBusyRef.current = getIsBusy;
  getActiveScrollBoxRef.current = getActiveScrollBox;
  nativePanelScrollRef.current = nativePanelScroll;
  stepThresholdRef.current = stepThreshold;
  stepLockMsRef.current = stepLockMs;

  useEffect(() => {
    if (!enabled) return;
    // Смена режима/unlock: не тащим spiral-lock в карточный жест.
    stateRef.current = INITIAL_WHEEL_LOCK_STATE;

    const stopSmoothScroll = () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      targetScrollRef.current = null;
      scrollElRef.current = null;
    };

    const ensureSmoothScroll = () => {
      if (rafRef.current != null) return;
      const tick = () => {
        const el = scrollElRef.current;
        const target = targetScrollRef.current;
        if (!el || target == null) {
          rafRef.current = null;
          return;
        }
        const next = lerpScrollTop(el.scrollTop, target, PANEL_SCROLL_LERP);
        el.scrollTop = next;
        if (next === target) {
          rafRef.current = null;
          targetScrollRef.current = null;
          return;
        }
        rafRef.current = window.requestAnimationFrame(tick);
      };
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      const dy = normalizeWheelDeltaY(event.deltaY, event.deltaMode, window.innerHeight);
      const isBusy = getIsBusyRef.current();
      const scrollBox = getActiveScrollBoxRef.current();
      const useNative = nativePanelScrollRef.current;
      // Берём lerped target, чтобы край панели совпадал с направлением скролла.
      const effectiveTop =
        !useNative &&
        scrollBox &&
        scrollElRef.current === scrollBox &&
        targetScrollRef.current != null
          ? targetScrollRef.current
          : undefined;
      const metrics = metricsFromElement(scrollBox, effectiveTop);

      // Сначала скролл внутри панели, если она переполнена — даже если
      // target события вне scroll-box (HUD, зазоры, hit-test под transform).
      if (!isBusy && panelCanConsumeWheel(metrics) && scrollBox && metrics) {
        if (!panelAtScrollEdge(metrics, dy)) {
          if (useNative) {
            // Карточки: overflow-y:auto без transform — пусть крутит браузер.
            stopSmoothScroll();
            return;
          }
          event.preventDefault();
          const fromTop = effectiveTop ?? scrollBox.scrollTop;
          targetScrollRef.current = nextScrollTopAfterWheel(
            { ...metrics, scrollTop: fromTop },
            dy,
            PANEL_WHEEL_SCROLL_FACTOR,
          );
          scrollElRef.current = scrollBox;
          ensureSmoothScroll();
          return;
        }
      }

      event.preventDefault();
      stopSmoothScroll();

      // Шаг секции во время поворота разрешён — goTo коалесцирует в pendingIndex
      // без kill/restart. isBusy выше по-прежнему режет скролл панели.
      const { state, step } = reduceWheelStep(stateRef.current, dy, performance.now(), {
        isBusy: false,
        threshold: stepThresholdRef.current,
        lockMs: stepLockMsRef.current,
      });
      stateRef.current = state;

      if (decayTimerRef.current != null) window.clearTimeout(decayTimerRef.current);
      decayTimerRef.current = window.setTimeout(() => {
        stateRef.current = clearWheelAccumulation(stateRef.current);
      }, WHEEL_ACC_DECAY_MS);

      if (step === 0) return;
      // Не сбрасываем scrollTop: на первой/последней секции шаг может быть no-op,
      // и обнуление прыгнет панель наверх. Реальные переходы чистят скролл
      // через clearScrollable().
      onStepRef.current(step);
    };

    document.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", onWheel);
      if (decayTimerRef.current != null) window.clearTimeout(decayTimerRef.current);
      stopSmoothScroll();
    };
  }, [enabled]);
}
