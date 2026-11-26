import { createContext, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

export type ModeTransitionPhase = "idle" | "exit" | "enter";

/** Стабильный API (редко меняется) — для NavSection/Header без подписки на currentIndex. */
export type SpiralNavigationApi = {
  sectionIds: SectionId[];
  isAccessible: boolean;
  goTo: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  toggleAccessible: () => void;
  registerPanel: (id: SectionId, sectionEl: HTMLElement, scrollEl: HTMLElement) => () => void;
  spiralRef: MutableRefObject<HTMLDivElement | null>;
  stageRef: MutableRefObject<HTMLElement | null>;
  currentIndexRef: MutableRefObject<number>;
};

/** Состояние для HUD / редких подписчиков. */
export type SpiralNavigationState = {
  sectionIds: SectionId[];
  currentIndex: number;
  targetIndex: number;
  isAccessible: boolean;
  isSpinning: boolean;
  /** Фаза анимации смены spiral ↔ accessible. */
  modeTransitionPhase: ModeTransitionPhase;
};

/** Совместимый полный снимок (Hud, Footer). */
export type SpiralNavigationValue = SpiralNavigationApi & SpiralNavigationState;

export const SpiralNavigationApiContext = createContext<SpiralNavigationApi | null>(null);
export const SpiralNavigationStateContext = createContext<SpiralNavigationState | null>(null);

/** @deprecated используйте Api/State контексты; оставлен для merge-хука. */
export const SpiralNavigationContext = createContext<SpiralNavigationValue | null>(null);
