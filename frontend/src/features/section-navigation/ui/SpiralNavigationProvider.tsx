import { useMemo, type ReactNode } from "react";

import type { SectionId } from "@/shared/content";

import { useSpiralNavigation } from "../hooks/useSpiralNavigation";
import {
  SpiralNavigationApiContext,
  SpiralNavigationStateContext,
  type SpiralNavigationApi,
  type SpiralNavigationState,
} from "../model/navigationContext";

type Props = {
  sectionIds: SectionId[];
  children: ReactNode;
};

export function SpiralNavigationProvider({ sectionIds, children }: Props) {
  const nav = useSpiralNavigation({ sectionIds });

  const api = useMemo<SpiralNavigationApi>(
    () => ({
      sectionIds: nav.sectionIds,
      isAccessible: nav.isAccessible,
      goTo: nav.goTo,
      goNext: nav.goNext,
      goPrev: nav.goPrev,
      toggleAccessible: nav.toggleAccessible,
      registerPanel: nav.registerPanel,
      spiralRef: nav.spiralRef,
      stageRef: nav.stageRef,
      currentIndexRef: nav.currentIndexRef,
    }),
    [
      nav.sectionIds,
      nav.isAccessible,
      nav.goTo,
      nav.goNext,
      nav.goPrev,
      nav.toggleAccessible,
      nav.registerPanel,
      nav.spiralRef,
      nav.stageRef,
      nav.currentIndexRef,
    ],
  );

  const state = useMemo<SpiralNavigationState>(
    () => ({
      sectionIds: nav.sectionIds,
      currentIndex: nav.currentIndex,
      targetIndex: nav.targetIndex,
      isAccessible: nav.isAccessible,
      isSpinning: nav.isSpinning,
      modeTransitionPhase: nav.modeTransitionPhase,
    }),
    [
      nav.sectionIds,
      nav.currentIndex,
      nav.targetIndex,
      nav.isAccessible,
      nav.isSpinning,
      nav.modeTransitionPhase,
    ],
  );

  return (
    <SpiralNavigationApiContext.Provider value={api}>
      <SpiralNavigationStateContext.Provider value={state}>
        {children}
      </SpiralNavigationStateContext.Provider>
    </SpiralNavigationApiContext.Provider>
  );
}
