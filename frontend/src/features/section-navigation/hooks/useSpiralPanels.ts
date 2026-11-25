import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";
import { sectionPaletteAt } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

import { applyPaletteToDocument } from "../lib/applyPaletteToDocument";

export type PanelNodes = {
  section: HTMLElement;
  scroll: HTMLElement;
};

type Options = {
  sectionIds: SectionId[];
  theme: Theme;
  isAccessible: boolean;
  currentIndexRef: MutableRefObject<number>;
  spinningFlagRef: MutableRefObject<boolean>;
};

export function useSpiralPanels({
  sectionIds,
  theme,
  isAccessible,
  currentIndexRef,
  spinningFlagRef,
}: Options) {
  const panelsRef = useRef<Map<SectionId, PanelNodes>>(new Map());
  const paintedIndexRef = useRef(-1);
  const settleTimerRef = useRef<number | null>(null);

  const applyColors = useCallback(
    (index: number, force = false) => {
      if (!force && index === paintedIndexRef.current) return;
      paintedIndexRef.current = index;
      const id = sectionIds[index] ?? "hero";
      applyPaletteToDocument(sectionPaletteAt(theme, index), id);
    },
    [sectionIds, theme],
  );

  const markActive = useCallback(
    (index: number) => {
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        nodes.section.classList.toggle("active", isOn);
        nodes.section.classList.toggle("is-far", !isOn && (i < index - 1 || i > index + 2));
        nodes.section.style.opacity = "1";
        nodes.section.style.visibility = "visible";
      });
    },
    [sectionIds],
  );

  const clearScrollable = useCallback(() => {
    panelsRef.current.forEach(({ scroll }) => {
      scroll.classList.remove("is-scrollable");
      scroll.style.overflow = "";
      scroll.style.pointerEvents = "";
      scroll.scrollTop = 0;
    });
  }, []);

  const settleActivePanel = useCallback(() => {
    if (isAccessible) return;
    const idx = currentIndexRef.current;
    panelsRef.current.forEach(({ scroll }, id) => {
      scroll.classList.remove("is-scrollable");
      scroll.style.overflow = "";
      scroll.style.pointerEvents = "";
      if (sectionIds.indexOf(id) !== idx) scroll.scrollTop = 0;
    });
    const activeId = sectionIds[idx];
    const active = activeId ? panelsRef.current.get(activeId) : undefined;
    if (!active) return;
    if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      if (isAccessible || spinningFlagRef.current || currentIndexRef.current !== idx) return;
      if (active.scroll.scrollHeight > active.scroll.clientHeight + 2) {
        // Inline styles: CSS-module :global hooks can miss; transforms need a sure overflow.
        active.scroll.classList.add("is-scrollable");
        active.scroll.style.overflow = "auto";
        active.scroll.style.pointerEvents = "auto";
      }
    }, 90);
  }, [currentIndexRef, isAccessible, sectionIds, spinningFlagRef]);

  const registerPanel = useCallback(
    (id: SectionId, sectionEl: HTMLElement, scrollEl: HTMLElement) => {
      panelsRef.current.set(id, { section: sectionEl, scroll: scrollEl });
      return () => {
        panelsRef.current.delete(id);
      };
    },
    [],
  );

  return {
    panelsRef,
    applyColors,
    markActive,
    clearScrollable,
    settleActivePanel,
    registerPanel,
  };
}
