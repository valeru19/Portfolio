import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";
import { sectionPaletteForId } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

import { applyPaletteToDocument } from "../lib/applyPaletteToDocument";
import { paintPanelPaletteForId } from "../lib/paintPanelPalette";
import { PANEL_STATE_ATTR, setPanelStateAttr } from "../model/panelStateAttrs";

/** Short delay after compositor settle before enabling overflow. */
const PANEL_SCROLL_ENABLE_DELAY_MS = 32;

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

  const paintAllPanelPalettes = useCallback(() => {
    sectionIds.forEach((id) => {
      const nodes = panelsRef.current.get(id);
      if (!nodes) return;
      paintPanelPaletteForId(nodes.section, theme, id);
    });
  }, [sectionIds, theme]);

  const applyColors = useCallback(
    (index: number, force = false) => {
      if (!force && index === paintedIndexRef.current) return;
      paintedIndexRef.current = index;
      const id = sectionIds[index] ?? "hero";
      applyPaletteToDocument(sectionPaletteForId(theme, id), id);
      if (force) paintAllPanelPalettes();
    },
    [paintAllPanelPalettes, sectionIds, theme],
  );

  const markActive = useCallback(
    (index: number, options?: { incomingIndex?: number }) => {
      const incomingIndex = options?.incomingIndex;
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        const isIncoming = incomingIndex != null && i === incomingIndex && !isOn;
        const isNeighbor = !isOn && !isIncoming && (i === index - 1 || i === index + 1);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.active, isOn);
        setPanelStateAttr(
          nodes.section,
          PANEL_STATE_ATTR.far,
          !isOn && !isIncoming && !isNeighbor && (i < index - 1 || i > index + 2),
        );
        // Only touch visibility styles when wrong — avoid style thrash every hop.
        if (nodes.section.style.opacity !== "1") nodes.section.style.opacity = "1";
        if (nodes.section.style.visibility !== "visible") nodes.section.style.visibility = "visible";
        if (nodes.section.style.clipPath) nodes.section.style.clipPath = "";
        // current (5) > incoming (4) > prev/next (3) > far arms (1).
        const z = isOn ? "5" : isIncoming ? "4" : isNeighbor ? "3" : "1";
        if (nodes.section.style.zIndex !== z) nodes.section.style.zIndex = z;
      });
    },
    [sectionIds],
  );

  const clearScrollable = useCallback(() => {
    // Lock interaction during a turn without thrashing overflow/scrollTop
    // (those paint as section-part flicker: scrollbar/content jump).
    panelsRef.current.forEach(({ scroll }) => {
      setPanelStateAttr(scroll, PANEL_STATE_ATTR.scrollable, false);
      scroll.style.pointerEvents = "none";
    });
  }, []);

  /**
   * Kick image decode for nearby panels. Do NOT read offsetWidth here —
   * forced layout mid-turn is a classic thrash source (css.dev / web.dev).
   */
  const warmSection = useCallback(
    (index: number) => {
      const id = sectionIds[index];
      const nodes = id ? panelsRef.current.get(id) : undefined;
      if (!nodes) return;
      if (nodes.section.style.opacity !== "1") nodes.section.style.opacity = "1";
      if (nodes.section.style.visibility !== "visible") nodes.section.style.visibility = "visible";
      nodes.section.querySelectorAll("img").forEach((img) => {
        if (img.complete) return;
        if (typeof img.decode === "function") {
          void img.decode().catch(() => undefined);
        } else {
          const probe = new Image();
          probe.src = img.currentSrc || img.src;
        }
      });
    },
    [sectionIds],
  );

  const warmAround = useCallback(
    (index: number) => {
      warmSection(index);
      if (index > 0) warmSection(index - 1);
      if (index < sectionIds.length - 1) warmSection(index + 1);
    },
    [sectionIds.length, warmSection],
  );

  const settleActivePanel = useCallback(
    (forIndex?: number) => {
      if (isAccessible) return;
      const idx = forIndex ?? currentIndexRef.current;
      panelsRef.current.forEach(({ scroll }, id) => {
        const i = sectionIds.indexOf(id);
        const isActive = i === idx;
        if (!isActive) {
          setPanelStateAttr(scroll, PANEL_STATE_ATTR.scrollable, false);
          scroll.style.pointerEvents = "none";
          // Never toggle overflow mid-reverse — that blanks panels on scale-down.
          // Don't yank scrollTop on the immediate previous/next either.
          if (i < idx - 1 || i > idx + 1) scroll.scrollTop = 0;
        }
      });
      const activeId = sectionIds[idx];
      const active = activeId ? panelsRef.current.get(activeId) : undefined;
      if (!active) return;

      const enable = () => {
        if (isAccessible || spinningFlagRef.current) return;
        if (currentIndexRef.current !== idx) return;
        setPanelStateAttr(active.scroll, PANEL_STATE_ATTR.scrollable, true);
        active.scroll.style.overflowY = "scroll";
        active.scroll.style.overflowX = "hidden";
        active.scroll.style.pointerEvents = "auto";
      };

      if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
      // Delay overflow until reverse scale has fully committed (legacy 70ms).
      settleTimerRef.current = window.setTimeout(enable, PANEL_SCROLL_ENABLE_DELAY_MS);
    },
    [currentIndexRef, isAccessible, sectionIds, spinningFlagRef],
  );

  const registerPanel = useCallback(
    (id: SectionId, sectionEl: HTMLElement, scrollEl: HTMLElement) => {
      panelsRef.current.set(id, { section: sectionEl, scroll: scrollEl });
      paintPanelPaletteForId(sectionEl, theme, id);
      return () => {
        panelsRef.current.delete(id);
      };
    },
    [theme],
  );

  return {
    panelsRef,
    applyColors,
    markActive,
    clearScrollable,
    warmAround,
    settleActivePanel,
    registerPanel,
  };
}
