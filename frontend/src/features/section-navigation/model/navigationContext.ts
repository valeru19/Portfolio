import { createContext, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

export type SpiralNavigationValue = {
  sectionIds: SectionId[];
  currentIndex: number;
  targetIndex: number;
  isAccessible: boolean;
  isSpinning: boolean;
  goTo: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  toggleAccessible: () => void;
  registerPanel: (id: SectionId, sectionEl: HTMLElement, scrollEl: HTMLElement) => () => void;
  spiralRef: MutableRefObject<HTMLDivElement | null>;
  stageRef: MutableRefObject<HTMLElement | null>;
};

export const SpiralNavigationContext = createContext<SpiralNavigationValue | null>(null);
