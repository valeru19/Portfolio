import { useEffect, useRef } from "react";

import { TOUCH_STEP_THRESHOLD } from "../model/constants";

type Options = {
  enabled: boolean;
  onStep: (direction: 1 | -1) => void;
};

export function useTouchStep({ enabled, onStep }: Options): void {
  const movedRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    if (!enabled) return;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      movedRef.current = 0;
      startXRef.current = touch.pageX;
      startYRef.current = touch.pageY;
    };

    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const dx = startXRef.current - touch.pageX;
      const dy = startYRef.current - touch.pageY;
      movedRef.current += dy + dx * 0.35;
      startXRef.current = touch.pageX;
      startYRef.current = touch.pageY;
    };

    const onEnd = () => {
      if (movedRef.current > TOUCH_STEP_THRESHOLD) onStepRef.current(1);
      else if (movedRef.current < -TOUCH_STEP_THRESHOLD) onStepRef.current(-1);
      movedRef.current = 0;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [enabled]);
}
