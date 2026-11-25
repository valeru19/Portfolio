import { useEffect, useRef } from "react";

import { WHEEL_ACC_DECAY_MS } from "../model/constants";
import {
  normalizeWheelDeltaY,
  panelAtScrollEdge,
  panelCanConsumeWheel,
  type ScrollBoxMetrics,
} from "../model/panelScroll";
import {
  INITIAL_WHEEL_LOCK_STATE,
  clearWheelAccumulation,
  reduceWheelStep,
  type WheelLockState,
} from "../model/wheelLock";

type Options = {
  enabled: boolean;
  isSpinning: boolean;
  getActiveScrollBox: () => HTMLElement | null;
  onStep: (direction: 1 | -1) => void;
};

function metricsFromElement(el: HTMLElement | null): ScrollBoxMetrics | null {
  if (!el) return null;
  return {
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    isScrollableClass: el.classList.contains("is-scrollable"),
  };
}

export function useWheelStep({ enabled, isSpinning, getActiveScrollBox, onStep }: Options): void {
  const stateRef = useRef<WheelLockState>(INITIAL_WHEEL_LOCK_STATE);
  const decayTimerRef = useRef<number | null>(null);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      const dy = normalizeWheelDeltaY(event.deltaY, event.deltaMode, window.innerHeight);
      const scrollBox = getActiveScrollBox();
      const metrics = metricsFromElement(scrollBox);

      if (
        !isSpinning &&
        panelCanConsumeWheel(metrics) &&
        scrollBox?.contains(event.target as Node)
      ) {
        if (metrics && !panelAtScrollEdge(metrics, dy)) return;
      }

      event.preventDefault();

      const { state, step } = reduceWheelStep(stateRef.current, dy, performance.now(), {
        isBusy: isSpinning,
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
  }, [enabled, isSpinning, getActiveScrollBox]);
}
