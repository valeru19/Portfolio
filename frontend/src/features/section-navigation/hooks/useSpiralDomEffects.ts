import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { replaceSectionHash } from "../lib/sectionHash";
import { rotationForSectionIndex } from "../model/geometry";
import { PANEL_STATE_ATTR, setPanelStateAttr } from "../model/panelStateAttrs";

type PanelNodes = {
  section: HTMLElement;
  scroll: HTMLElement;
};

type Options = {
  isAccessible: boolean;
  sectionIds: SectionId[];
  spiralRef: MutableRefObject<HTMLDivElement | null>;
  panelsRef: MutableRefObject<Map<SectionId, PanelNodes>>;
  rotationRef: MutableRefObject<number>;
  spinningRef: MutableRefObject<boolean>;
  currentIndexRef: MutableRefObject<number>;
  killMotion: () => void;
  ensureGsap: () => Promise<unknown>;
  buildSpiral: () => void;
  paintSpiralTransform: (rotationDeg: number) => void;
  markActive: (index: number) => void;
  markAccessibleCards: (index: number) => void;
  applyColors: (index: number, force?: boolean) => void;
  settleActivePanel: (forIndex?: number) => void;
  setIsSpinning: (value: boolean) => void;
  setCurrentIndex: (value: number) => void;
  setTargetIndex: (value: number) => void;
  spinningFlagRef: MutableRefObject<boolean>;
  pendingIndexRef: MutableRefObject<number>;
};

function clearSpiralInlineStyles(
  spiral: HTMLDivElement | null,
  panels: Map<SectionId, PanelNodes>,
): void {
  if (spiral) spiral.style.transform = "";
  panels.forEach(({ section, scroll }) => {
    section.style.transform = "";
    section.style.width = "";
    section.style.height = "";
    section.style.zIndex = "";
    section.style.filter = "";
    section.style.removeProperty("--panel-blur");
    section.style.opacity = "";
    section.style.visibility = "";
    setPanelStateAttr(section, PANEL_STATE_ATTR.ahead, false);
    if (section.hasAttribute(PANEL_STATE_ATTR.panelView)) {
      section.removeAttribute(PANEL_STATE_ATTR.panelView);
    }
    scroll.style.overflow = "";
  });
}

/** Смена режима и resize. Колбэки — через ref: смена темы/языка не убивает ход. */
export function useSpiralDomEffects({
  isAccessible,
  sectionIds,
  spiralRef,
  panelsRef,
  rotationRef,
  spinningRef,
  currentIndexRef,
  killMotion,
  ensureGsap,
  buildSpiral,
  paintSpiralTransform,
  markActive,
  markAccessibleCards,
  applyColors,
  settleActivePanel,
  setIsSpinning,
  setCurrentIndex,
  setTargetIndex,
  spinningFlagRef,
  pendingIndexRef,
}: Options): void {
  const sectionIdsRef = useRef(sectionIds);
  sectionIdsRef.current = sectionIds;

  const apiRef = useRef({
    killMotion,
    ensureGsap,
    buildSpiral,
    paintSpiralTransform,
    markActive,
    markAccessibleCards,
    applyColors,
    settleActivePanel,
    setIsSpinning,
    setCurrentIndex,
    setTargetIndex,
  });
  apiRef.current = {
    killMotion,
    ensureGsap,
    buildSpiral,
    paintSpiralTransform,
    markActive,
    markAccessibleCards,
    applyColors,
    settleActivePanel,
    setIsSpinning,
    setCurrentIndex,
    setTargetIndex,
  };

  // Только смена режима spiral↔accessible. Не зависит от identity колбэков/theme.
  useLayoutEffect(() => {
    const api = apiRef.current;
    api.killMotion();
    spinningFlagRef.current = false;
    api.setIsSpinning(false);

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Цель хода (pending), не промежуточный current — иначе язык/тема/режим
    // во время спина сажают на «05 из 07».
    const idx = pendingIndexRef.current;
    currentIndexRef.current = idx;
    api.setCurrentIndex(idx);
    api.setTargetIndex(idx);
    const landId = sectionIdsRef.current[idx];
    if (landId) replaceSectionHash(landId);

    if (isAccessible) {
      clearSpiralInlineStyles(spiralRef.current, panelsRef.current);
      api.markAccessibleCards(idx);
      api.applyColors(idx, false);
      return;
    }

    clearSpiralInlineStyles(spiralRef.current, panelsRef.current);
    panelsRef.current.forEach(({ section }) => {
      setPanelStateAttr(section, PANEL_STATE_ATTR.active, false);
      if (section.hasAttribute(PANEL_STATE_ATTR.cardDelta)) {
        section.removeAttribute(PANEL_STATE_ATTR.cardDelta);
      }
    });
    const rot = rotationForSectionIndex(idx);
    rotationRef.current = rot;
    api.buildSpiral();
    api.paintSpiralTransform(rot);
    api.markActive(idx);
    api.applyColors(idx, false);

    let cancelled = false;
    void (async () => {
      await api.ensureGsap();
      if (cancelled) return;
      api.buildSpiral();
      api.paintSpiralTransform(rot);
      api.markActive(idx);
      api.settleActivePanel(idx);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- только isAccessible; остальное через ref
  }, [isAccessible]);

  useEffect(() => {
    const onResize = () => {
      if (isAccessible) return;
      const api = apiRef.current;
      api.buildSpiral();
      api.paintSpiralTransform(rotationRef.current);
      if (!spinningRef.current) api.settleActivePanel();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isAccessible, rotationRef, spinningRef]);
}
