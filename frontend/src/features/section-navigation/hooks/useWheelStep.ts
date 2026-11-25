import { useEffect, useRef } from "react";

import {
  PANEL_SCROLL_LERP,
  PANEL_WHEEL_SCROLL_FACTOR,
  WHEEL_ACC_DECAY_MS,
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
  /** Prefer a ref-backed getter so the listener stays stable across spins. */
  getIsBusy: () => boolean;
  getActiveScrollBox: () => HTMLElement | null;
  onStep: (direction: 1 | -1) => void;
};

function metricsFromElement(el: HTMLElement | null, scrollTopOverride?: number): ScrollBoxMetrics | null {
  if (!el) return null;
  return {
    scrollTop: scrollTopOverride ?? el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    hasScrollableAttr: el.hasAttribute(PANEL_STATE_ATTR.scrollable),
  };
}

export function useWheelStep({ enabled, getIsBusy, getActiveScrollBox, onStep }: Options): void {
  const stateRef = useRef<WheelLockState>(INITIAL_WHEEL_LOCK_STATE);
  const decayTimerRef = useRef<number | null>(null);
  const onStepRef = useRef(onStep);
  const getIsBusyRef = useRef(getIsBusy);
  const getActiveScrollBoxRef = useRef(getActiveScrollBox);
  const targetScrollRef = useRef<number | null>(null);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  onStepRef.current = onStep;
  getIsBusyRef.current = getIsBusy;
  getActiveScrollBoxRef.current = getActiveScrollBox;

  useEffect(() => {
    if (!enabled) return;

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
      // Use the lerped target so edge detection matches where scroll is heading.
      const effectiveTop =
        scrollBox && scrollElRef.current === scrollBox && targetScrollRef.current != null
          ? targetScrollRef.current
          : undefined;
      const metrics = metricsFromElement(scrollBox, effectiveTop);

      // Prefer inner panel scroll whenever the active panel overflows, even if the
      // event target sits outside the scroll box (HUD, gaps, transform hit-testing).
      if (!isBusy && panelCanConsumeWheel(metrics) && scrollBox && metrics) {
        if (!panelAtScrollEdge(metrics, dy)) {
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

      // Allow section intent while a turn is in flight — goTo coalesces into
      // pendingIndex instead of kill/restart. isBusy still blocks panel scroll above.
      const { state, step } = reduceWheelStep(stateRef.current, dy, performance.now(), {
        isBusy: false,
      });
      stateRef.current = state;

      if (decayTimerRef.current != null) window.clearTimeout(decayTimerRef.current);
      decayTimerRef.current = window.setTimeout(() => {
        stateRef.current = clearWheelAccumulation(stateRef.current);
      }, WHEEL_ACC_DECAY_MS);

      if (step === 0) return;
      // Do not reset scrollTop here: on the first/last section a step may be a no-op,
      // and wiping scrollTop makes the panel jump back to the top. Real navigations
      // already clear panel scroll via clearScrollable().
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
