import { useEffect, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";

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
  applyColors: (index: number, force?: boolean) => void;
  settleActivePanel: (forIndex?: number) => void;
  setIsSpinning: (value: boolean) => void;
  setCurrentIndex: (value: number) => void;
  setTargetIndex: (value: number) => void;
  spinningFlagRef: MutableRefObject<boolean>;
  pendingIndexRef: MutableRefObject<number>;
};

/** Mode switch, resize rebuild, accessible scroll-spy. */
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
  applyColors,
  settleActivePanel,
  setIsSpinning,
  setCurrentIndex,
  setTargetIndex,
  spinningFlagRef,
  pendingIndexRef,
}: Options): void {
  useEffect(() => {
    killMotion();
    spinningFlagRef.current = false;
    setIsSpinning(false);

    if (isAccessible) {
      const spiral = spiralRef.current;
      if (spiral) spiral.style.transform = "";
      panelsRef.current.forEach(({ section, scroll }) => {
        section.style.transform = "";
        section.style.width = "";
        section.style.height = "";
        section.style.zIndex = "";
        section.style.filter = "";
        section.style.opacity = "1";
        section.style.visibility = "visible";
        setPanelStateAttr(section, PANEL_STATE_ATTR.far, false);
        setPanelStateAttr(section, PANEL_STATE_ATTR.active, true);
        setPanelStateAttr(scroll, PANEL_STATE_ATTR.scrollable, false);
        scroll.style.overflow = "";
        scroll.style.pointerEvents = "";
      });
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      applyColors(currentIndexRef.current, true);
      return;
    }

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const idx = currentIndexRef.current;
    const rot = rotationForSectionIndex(idx);
    pendingIndexRef.current = idx;
    // Sync rebuild + paint first — awaiting ensureGsap() used to leave a frame
    // of cleared spiral transform (bird's-eye of every panel). CSS path is enough
    // until GSAP loads; then we re-apply with gsap.set.
    buildSpiral();
    paintSpiralTransform(rot);
    markActive(idx);
    applyColors(idx, true);
    setTargetIndex(idx);

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

  useEffect(() => {
    if (!isAccessible) return;
    const onScroll = () => {
      const marker = window.scrollY + Math.min(120, window.innerHeight * 0.22);
      let best = 0;
      sectionIds.forEach((id, i) => {
        const el = panelsRef.current.get(id)?.section;
        if (el && el.offsetTop <= marker) best = i;
      });
      if (best !== currentIndexRef.current) {
        setCurrentIndex(best);
        setTargetIndex(best);
        applyColors(best);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [
    isAccessible,
    sectionIds,
    applyColors,
    panelsRef,
    currentIndexRef,
    setCurrentIndex,
    setTargetIndex,
  ]);
}
