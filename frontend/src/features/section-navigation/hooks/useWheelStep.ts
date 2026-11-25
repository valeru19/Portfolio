import { useEffect, useRef } from "react";

import { WHEEL_ACC_DECAY_MS } from "../model/constants";
import {
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

function metricsFromElement(el: HTMLElement | null): ScrollBoxMetrics | null {
  if (!el) return null;
  return {
    scrollTop: el.scrollTop,
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
  onStepRef.current = onStep;
  getIsBusyRef.current = getIsBusy;
  getActiveScrollBoxRef.current = getActiveScrollBox;

  useEffect(() => {
    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      const dy = normalizeWheelDeltaY(event.deltaY, event.deltaMode, window.innerHeight);
      const isBusy = getIsBusyRef.current();
      const scrollBox = getActiveScrollBoxRef.current();
      const metrics = metricsFromElement(scrollBox);
      const target = event.target;
      const targetInsidePanel =
        scrollBox != null &&
        target instanceof Node &&
        (scrollBox === target || scrollBox.contains(target));

      if (!isBusy && panelCanConsumeWheel(metrics) && targetInsidePanel && metrics) {
        if (!panelAtScrollEdge(metrics, dy)) {
          // Drive scroll manually — native wheel scroll fails under spiral transforms.
          event.preventDefault();
          scrollBox.scrollTop = nextScrollTopAfterWheel(metrics, dy);
          return;
        }
      }

      event.preventDefault();

      const { state, step } = reduceWheelStep(stateRef.current, dy, performance.now(), {
        isBusy,
      });
      stateRef.current = state;

      if (decayTimerRef.current != null) window.clearTimeout(decayTimerRef.current);
      decayTimerRef.current = window.setTimeout(() => {
        stateRef.current = clearWheelAccumulation(stateRef.current);
      }, WHEEL_ACC_DECAY_MS);

      if (step === 0) return;
      if (scrollBox) scrollBox.scrollTop = 0;
      onStepRef.current(step);
    };

    document.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", onWheel);
      if (decayTimerRef.current != null) window.clearTimeout(decayTimerRef.current);
    };
  }, [enabled]);
}
