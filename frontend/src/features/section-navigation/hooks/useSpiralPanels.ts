import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";
import { sectionPaletteForId } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

import { applyPaletteToDocument } from "../lib/applyPaletteToDocument";
import { paintPanelPaletteForId } from "../lib/paintPanelPalette";
import {
  applyPanelViewsInstant,
  bumpPanelViewGeneration,
  prepareLongJumpViews,
  revealNextBlurAfterLand,
  settlePanelViewsAfterLand,
} from "../lib/panelViewController";
import { decodePanelImages } from "../lib/panelReveal";
import { PANEL_STATE_ATTR, setCardDeltaAttr, setPanelStateAttr } from "../model/panelStateAttrs";

/** Короткая пауза после settle compositor, прежде чем включить overflow. */
const PANEL_SCROLL_ENABLE_DELAY_MS = 48;

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

function indexMap(
  sectionIds: SectionId[],
  panels: Map<SectionId, PanelNodes>,
): Map<number, PanelNodes> {
  const out = new Map<number, PanelNodes>();
  sectionIds.forEach((id, i) => {
    const nodes = panels.get(id);
    if (nodes) out.set(i, nodes);
  });
  return out;
}

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
  const viewLandGenRef = useRef(0);

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
      // Сначала все чтения индексов / attrs, потом записи (без getComputedStyle).
      const writes: Array<() => void> = [];
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        writes.push(() => {
          setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.active, isOn);
          // ahead только у next (active+1), на последней next нет.
          setPanelStateAttr(
            nodes.section,
            PANEL_STATE_ATTR.ahead,
            !isOn && i === index + 1 && index + 1 < sectionIds.length,
          );
          if (nodes.section.style.opacity !== "1") nodes.section.style.opacity = "1";
          if (nodes.section.style.visibility !== "visible") {
            nodes.section.style.visibility = "visible";
          }
          if (nodes.section.style.clipPath) nodes.section.style.clipPath = "";
          const z = isOn ? "5" : "1";
          if (nodes.section.style.zIndex !== z) nodes.section.style.zIndex = z;
        });
      });
      for (const write of writes) write();

      const byIndex = indexMap(sectionIds, panelsRef.current);
      // Sync idle attrs сразу (clearSpiralInlineStyles снимает data-panel-view).
      const list = [...byIndex.entries()].map(([panelIndex, nodes]) => ({
        index: panelIndex,
        nodes,
      }));
      if (list.length > 0) {
        applyPanelViewsInstant(list, index, sectionIds.length);
      }
      // Blur next дооткрываем отдельным кадром (не в кадре land).
      void settlePanelViewsAfterLand(byIndex, index, sectionIds.length).then((gen) => {
        viewLandGenRef.current = gen;
        requestAnimationFrame(() => {
          if (viewLandGenRef.current !== gen) return;
          void revealNextBlurAfterLand(byIndex, index, sectionIds.length, gen);
        });
      });
    },
    [sectionIds],
  );

  /**
   * Линейный режим: раскладка карточного стека.
   * delta 0 — текущая; >0 снизу (всплывает); <0 уходит назад/вверх.
   */
  const markAccessibleCards = useCallback(
    (index: number) => {
      bumpPanelViewGeneration();
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        const delta = i - index;
        setCardDeltaAttr(nodes.section, delta);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.active, isOn);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.ahead, false);
        nodes.section.removeAttribute(PANEL_STATE_ATTR.panelView);
        if (nodes.section.style.filter) nodes.section.style.filter = "";
        nodes.section.style.removeProperty("--panel-veil");
        nodes.section.style.removeProperty("--panel-blur-radius");

        if (isOn) {
          setPanelStateAttr(nodes.scroll, PANEL_STATE_ATTR.scrollable, true);
          if (nodes.scroll.style.pointerEvents !== "auto") {
            nodes.scroll.style.pointerEvents = "auto";
          }
        } else {
          setPanelStateAttr(nodes.scroll, PANEL_STATE_ATTR.scrollable, false);
          if (nodes.scroll.style.pointerEvents !== "none") {
            nodes.scroll.style.pointerEvents = "none";
          }
          if (Math.abs(delta) > 1) nodes.scroll.scrollTop = 0;
        }
      });
    },
    [sectionIds],
  );

  const clearScrollable = useCallback(() => {
    panelsRef.current.forEach(({ scroll }) => {
      const wasScrollable = scroll.hasAttribute(PANEL_STATE_ATTR.scrollable);
      if (wasScrollable) setPanelStateAttr(scroll, PANEL_STATE_ATTR.scrollable, false);
      if (scroll.style.pointerEvents !== "none") scroll.style.pointerEvents = "none";
    });
  }, []);

  const warmSection = useCallback(
    (index: number) => {
      const id = sectionIds[index];
      const nodes = id ? panelsRef.current.get(id) : undefined;
      if (!nodes) return;
      if (nodes.section.style.opacity !== "1") nodes.section.style.opacity = "1";
      if (nodes.section.style.visibility !== "visible") nodes.section.style.visibility = "visible";
      decodePanelImages(nodes.section);
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

  /**
   * Перед длинным ходом: только dest и dest+1 под непрозрачной заливкой
   * (контент включён, decode, вуаль на dest+1). Поворот стартует ≤150 мс.
   */
  const prepareJump = useCallback(
    async (_fromIndex: number, destIndex: number, goingBack = false) => {
      const byIndex = indexMap(sectionIds, panelsRef.current);
      await prepareLongJumpViews(byIndex, destIndex, sectionIds.length, goingBack);
    },
    [sectionIds],
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
        active.scroll.style.pointerEvents = "auto";
      };

      if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
      settleTimerRef.current = window.setTimeout(enable, PANEL_SCROLL_ENABLE_DELAY_MS);
    },
    [currentIndexRef, isAccessible, sectionIds, spinningFlagRef],
  );

  const registerPanel = useCallback(
    (id: SectionId, sectionEl: HTMLElement, scrollEl: HTMLElement) => {
      panelsRef.current.set(id, { section: sectionEl, scroll: scrollEl });
      paintPanelPaletteForId(sectionEl, theme, id);
      if (isAccessible) {
        const index = currentIndexRef.current;
        const i = sectionIds.indexOf(id);
        if (i >= 0) {
          const delta = i - index;
          const isOn = i === index;
          setCardDeltaAttr(sectionEl, delta);
          setPanelStateAttr(sectionEl, PANEL_STATE_ATTR.active, isOn);
          setPanelStateAttr(scrollEl, PANEL_STATE_ATTR.scrollable, isOn);
          scrollEl.style.pointerEvents = isOn ? "auto" : "none";
        }
      } else {
        // Idle-вид сразу; когда все панели в map — ещё раз sync (Strict Mode /
        // порядок mount иначе оставлял дальние без data-panel-view).
        const syncIdleViews = () => {
          const active = currentIndexRef.current;
          const byIndex = indexMap(sectionIds, panelsRef.current);
          if (byIndex.size < sectionIds.length) return;
          const list = [...byIndex.entries()].map(([index, nodes]) => ({ index, nodes }));
          applyPanelViewsInstant(list, active, sectionIds.length);
          sectionIds.forEach((sectionId, index) => {
            const nodes = panelsRef.current.get(sectionId);
            if (!nodes) return;
            setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.active, index === active);
            setPanelStateAttr(
              nodes.section,
              PANEL_STATE_ATTR.ahead,
              index === active + 1 && active + 1 < sectionIds.length,
            );
          });
        };
        const active = currentIndexRef.current;
        const byIndex = indexMap(sectionIds, panelsRef.current);
        const list = [...byIndex.entries()].map(([index, nodes]) => ({ index, nodes }));
        applyPanelViewsInstant(list, active, sectionIds.length);
        setPanelStateAttr(sectionEl, PANEL_STATE_ATTR.active, sectionIds.indexOf(id) === active);
        setPanelStateAttr(
          sectionEl,
          PANEL_STATE_ATTR.ahead,
          sectionIds.indexOf(id) === active + 1 && active + 1 < sectionIds.length,
        );
        if (panelsRef.current.size >= sectionIds.length) {
          queueMicrotask(syncIdleViews);
        }
      }
      return () => {
        panelsRef.current.delete(id);
      };
    },
    [theme, isAccessible, sectionIds, currentIndexRef],
  );

  return {
    panelsRef,
    applyColors,
    markActive,
    markAccessibleCards,
    clearScrollable,
    warmAround,
    prepareJump,
    settleActivePanel,
    registerPanel,
  };
}
