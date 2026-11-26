import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";
import { sectionPaletteForId } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

import { applyPaletteToDocument } from "../lib/applyPaletteToDocument";
import { inactivePanelBlurPx, paintPanelBlur } from "../lib/panelBlur";
import { paintPanelPaletteForId } from "../lib/paintPanelPalette";
import { PANEL_STATE_ATTR, setPanelStateAttr } from "../model/panelStateAttrs";

/** Короткая пауза после settle compositor, прежде чем включить overflow. */
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
    (index: number) => {
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        const isNeighbor = !isOn && (i === index - 1 || i === index + 1);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.active, isOn);
        setPanelStateAttr(
          nodes.section,
          PANEL_STATE_ATTR.far,
          !isOn && !isNeighbor && (i < index - 1 || i > index + 2),
        );
        // Visibility трогаем только если неверно — без style thrash на каждый шаг.
        if (nodes.section.style.opacity !== "1") nodes.section.style.opacity = "1";
        if (nodes.section.style.visibility !== "visible") nodes.section.style.visibility = "visible";
        if (nodes.section.style.clipPath) nodes.section.style.clipPath = "";
        // Поднимаем только текущую. Без boost входящей/соседей —
        // из-за них секции наезжали друг на друга при перевороте.
        const z = isOn ? "5" : "1";
        if (nodes.section.style.zIndex !== z) nodes.section.style.zIndex = z;
        // В покое: текущая резкая, остальные размыты.
        paintPanelBlur(nodes.section, isOn ? 0 : inactivePanelBlurPx());
      });
    },
    [sectionIds],
  );

  const clearScrollable = useCallback(() => {
    // Блокируем взаимодействие на повороте без thrash overflow/scrollTop
    // (иначе мерцает скроллбар и прыгает контент).
    panelsRef.current.forEach(({ scroll }) => {
      setPanelStateAttr(scroll, PANEL_STATE_ATTR.scrollable, false);
      scroll.style.pointerEvents = "none";
    });
  }, []);

  /**
   * Прогрев decode картинок соседних панелей. Не читать offsetWidth —
   * forced layout mid-turn классический источник thrash.
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
          // Не трогаем overflow mid-reverse — панели белеют на scale-down.
          // И не обнуляем scrollTop у ближайших prev/next.
          if (i < idx - 1 || i > idx + 1) scroll.scrollTop = 0;
        }
      });
      const activeId = sectionIds[idx];
      const active = activeId ? panelsRef.current.get(activeId) : undefined;
      if (!active) return;

      const enable = () => {
        if (isAccessible || spinningFlagRef.current) return;
        if (currentIndexRef.current !== idx) return;
        // Только атрибут — overflow из CSS. Инлайн overflow давал
        // layout/paint hitch (вспышка скроллбара) на каждом приземлении.
        setPanelStateAttr(active.scroll, PANEL_STATE_ATTR.scrollable, true);
        active.scroll.style.pointerEvents = "auto";
      };

      if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
      // Ждём коммит reverse scale, потом overflow (в legacy было ~70ms).
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
