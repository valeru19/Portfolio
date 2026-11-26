import { useEffect, useLayoutEffect, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

import { rotationForSectionIndex } from "../model/geometry";
import { PANEL_STATE_ATTR, setPanelStateAttr } from "../model/panelStateAttrs";

type PanelNodes = {
  section: HTMLElement;
  scroll: HTMLElement;
};

type Options = {
  isAccessible: boolean;
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
    setPanelStateAttr(section, PANEL_STATE_ATTR.far, false);
    setPanelStateAttr(section, PANEL_STATE_ATTR.ahead, false);
    scroll.style.overflow = "";
  });
}

/** Смена режима, rebuild на resize. */
export function useSpiralDomEffects({
  isAccessible,
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
  setTargetIndex,
  spinningFlagRef,
  pendingIndexRef,
}: Options): void {
  // layout: первый paint уже в целевом режиме (без вспышки spiral→card).
  // Unlock mode-fade делает toggleAccessible (exit→swap→enter).
  useLayoutEffect(() => {
    killMotion();
    spinningFlagRef.current = false;
    setIsSpinning(false);

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const idx = currentIndexRef.current;
    pendingIndexRef.current = idx;
    setTargetIndex(idx);

    if (isAccessible) {
      // Узлы те же (без remount) — сбрасываем spiral inline, ставим card-delta.
      clearSpiralInlineStyles(spiralRef.current, panelsRef.current);
      markAccessibleCards(idx);
      // Палитра уже на месте — не force-paint всех панелей.
      applyColors(idx, false);
      return;
    }

    // Сбрасываем card-delta / inline от accessible, затем spiral layout.
    clearSpiralInlineStyles(spiralRef.current, panelsRef.current);
    panelsRef.current.forEach(({ section }) => {
      setPanelStateAttr(section, PANEL_STATE_ATTR.active, false);
      if (section.hasAttribute(PANEL_STATE_ATTR.cardDelta)) {
        section.removeAttribute(PANEL_STATE_ATTR.cardDelta);
      }
    });
    const rot = rotationForSectionIndex(idx);
    // Sync rebuild+paint: await ensureGsap() оставлял кадр с пустым transform.
    buildSpiral();
    paintSpiralTransform(rot);
    markActive(idx);
    applyColors(idx, false);

    let cancelled = false;
    void (async () => {
      await ensureGsap();
      if (cancelled) return;
      buildSpiral();
      paintSpiralTransform(rot);
      markActive(idx);
      settleActivePanel(idx);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isAccessible,
    killMotion,
    ensureGsap,
    buildSpiral,
    paintSpiralTransform,
    markActive,
    markAccessibleCards,
    applyColors,
    settleActivePanel,
    setIsSpinning,
    setTargetIndex,
    spiralRef,
    panelsRef,
    currentIndexRef,
    spinningFlagRef,
    pendingIndexRef,
  ]);

  useEffect(() => {
    const onResize = () => {
      if (isAccessible) return;
      buildSpiral();
      paintSpiralTransform(rotationRef.current);
      if (!spinningRef.current) settleActivePanel();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [
    isAccessible,
    buildSpiral,
    paintSpiralTransform,
    rotationRef,
    spinningRef,
    settleActivePanel,
  ]);
}
