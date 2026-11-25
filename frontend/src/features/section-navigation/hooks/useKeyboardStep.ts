import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  onStep: (direction: 1 | -1) => void;
};

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", " ", "PageDown"]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp"]);

export function useKeyboardStep({ enabled, onStep }: Options): void {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    if (!enabled) return;

    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName ?? "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;

      if (NEXT_KEYS.has(event.key)) {
        event.preventDefault();
        onStepRef.current(1);
      } else if (PREV_KEYS.has(event.key)) {
        event.preventDefault();
        onStepRef.current(-1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
