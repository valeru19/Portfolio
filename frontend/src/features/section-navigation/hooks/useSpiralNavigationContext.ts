import { useContext } from "react";

import { SpiralNavigationContext, type SpiralNavigationValue } from "../model/navigationContext";

export function useSpiralNavigationContext(): SpiralNavigationValue {
  const ctx = useContext(SpiralNavigationContext);
  if (!ctx) {
    throw new Error("useSpiralNavigationContext must be used within SpiralNavigationProvider");
  }
  return ctx;
}

export function useOptionalSpiralNavigation(): SpiralNavigationValue | null {
  return useContext(SpiralNavigationContext);
}
