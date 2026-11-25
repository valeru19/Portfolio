import { useEffect, useRef, useState, type RefObject } from "react";

import { nextAccessibleHeaderHidden } from "../model/accessibleHeaderHide";

type Options = {
  enabled: boolean;
  headerRef: RefObject<HTMLElement | null>;
};

export function useAccessibleHeaderHide({ enabled, headerRef }: Options): boolean {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      hiddenRef.current = false;
      setIsHidden(false);
      return;
    }

    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        const scrollY = window.scrollY;
        const deltaY = scrollY - lastScrollYRef.current;
        lastScrollYRef.current = scrollY;
        const header = headerRef.current;
        const active = document.activeElement;
        const isFocusInsideHeader = Boolean(
          header && active instanceof Node && header.contains(active),
        );
        const next = nextAccessibleHeaderHidden({
          scrollY,
          deltaY,
          isFocusInsideHeader,
          currentlyHidden: hiddenRef.current,
        });
        if (next !== hiddenRef.current) {
          hiddenRef.current = next;
          setIsHidden(next);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, headerRef]);

  return isHidden;
}
