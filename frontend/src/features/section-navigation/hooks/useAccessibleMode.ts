import { useCallback, useEffect, useState } from "react";

import { STORAGE_MODE } from "@/shared/config";
import { safeGetItem, safeSetItem } from "@/shared/lib";

import { ACCESSIBLE_MODE_VALUE, SPIRAL_MODE_VALUE } from "../model/constants";
import { prefersReducedMotion } from "../model/prefersReducedMotion";

function readStoredAccessible(): boolean {
  return safeGetItem(STORAGE_MODE) === ACCESSIBLE_MODE_VALUE;
}

function initialAccessible(): boolean {
  return readStoredAccessible() || prefersReducedMotion();
}

export type AccessibleModeApi = {
  isAccessible: boolean;
  setAccessible: (next: boolean) => void;
  toggleAccessible: () => void;
};

export function useAccessibleMode(): AccessibleModeApi {
  const [isAccessible, setIsAccessible] = useState(initialAccessible);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      if (media.matches) setIsAccessible(true);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("is-accessible", isAccessible);
    document.body.classList.toggle("is-accessible", isAccessible);
  }, [isAccessible]);

  const setAccessible = useCallback((next: boolean) => {
    setIsAccessible(next);
    safeSetItem(STORAGE_MODE, next ? ACCESSIBLE_MODE_VALUE : SPIRAL_MODE_VALUE);
  }, []);

  const toggleAccessible = useCallback(() => {
    setAccessible(!isAccessible);
  }, [isAccessible, setAccessible]);

  return { isAccessible, setAccessible, toggleAccessible };
}
