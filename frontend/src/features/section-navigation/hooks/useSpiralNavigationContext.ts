import { useContext, useMemo } from "react";

import {
  SpiralNavigationApiContext,
  SpiralNavigationStateContext,
  type SpiralNavigationApi,
  type SpiralNavigationValue,
} from "../model/navigationContext";

export function useSpiralNavigationApi(): SpiralNavigationApi {
  const api = useContext(SpiralNavigationApiContext);
  if (!api) {
    throw new Error("useSpiralNavigationApi must be used within SpiralNavigationProvider");
  }
  return api;
}

export function useSpiralNavigationContext(): SpiralNavigationValue {
  const api = useContext(SpiralNavigationApiContext);
  const state = useContext(SpiralNavigationStateContext);
  if (!api || !state) {
    throw new Error("useSpiralNavigationContext must be used within SpiralNavigationProvider");
  }
  return useMemo(() => ({ ...api, ...state }), [api, state]);
}

export function useOptionalSpiralNavigation(): SpiralNavigationValue | null {
  const api = useContext(SpiralNavigationApiContext);
  const state = useContext(SpiralNavigationStateContext);
  return useMemo(() => (api && state ? { ...api, ...state } : null), [api, state]);
}
