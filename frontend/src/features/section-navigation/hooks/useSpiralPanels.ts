import { useCallback, useRef, type MutableRefObject } from "react";

import type { SectionId } from "@/shared/content";
import { sectionPaletteForId } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

import { applyPaletteToDocument } from "../lib/applyPaletteToDocument";
import {
  BLUR_LITE_SCALE,
  effectivePanelScale,
  idleVeilAmount,
  paintBlurLiteFlag,
  paintPanelVeil,
  panelBlurPxForScale,
  PANEL_BLUR_RADIUS_VAR,
  PANEL_VEIL_VAR,
} from "../lib/panelBlur";
import { paintPanelPaletteForId } from "../lib/paintPanelPalette";
import { bakeAndAttachPanel, estimateBakeCacheBytes } from "../lib/panelBake";
import {
  rememberPanelIntrinsicHeight,
  revealPanelFromFrost,
  warmPanelsForJump,
} from "../lib/panelReveal";
import { PANEL_BLUR_PX } from "../model/constants";
import { PANEL_STATE_ATTR, setCardDeltaAttr, setPanelStateAttr } from "../model/panelStateAttrs";

/** Короткая пауза после settle compositor, прежде чем включить overflow. */
const PANEL_SCROLL_ENABLE_DELAY_MS = 48;
/** Far-панели: veil/attr не в том же кадре, что from/dest. */
const FAR_BLUR_BATCH = 2;

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
  const farBlurRafRef = useRef(0);
  const revealGenRef = useRef(0);
  const bakeIdleRef = useRef(0);

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
      if (farBlurRafRef.current) {
        cancelAnimationFrame(farBlurRafRef.current);
        farBlurRafRef.current = 0;
      }
      const revealGen = ++revealGenRef.current;
      const farQueue: PanelNodes[] = [];
      const revealQueue: PanelNodes[] = [];

      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        const isNeighbor = !isOn && (i === index - 1 || i === index + 1);
        const wantFar = !isOn && !isNeighbor && (i < index - 1 || i > index + 2);
        const wasFar = nodes.section.hasAttribute(PANEL_STATE_ATTR.far);
        const wantLite =
          !isOn && (effectivePanelScale(i, index) < BLUR_LITE_SCALE || Math.abs(i - index) > 1);

        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.active, isOn);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.ahead, !isOn && i > index);
        if (nodes.section.style.opacity !== "1") nodes.section.style.opacity = "1";
        if (nodes.section.style.visibility !== "visible")
          nodes.section.style.visibility = "visible";
        if (nodes.section.style.clipPath) nodes.section.style.clipPath = "";
        const z = isOn ? "5" : "1";
        if (nodes.section.style.zIndex !== z) nodes.section.style.zIndex = z;

        const scale = effectivePanelScale(i, index);
        const radius = isOn ? PANEL_BLUR_PX : panelBlurPxForScale(scale);

        // Уход в far: сначала frost (квадратик), far — батчем позже (не в кадре посадки near).
        if (wantFar) {
          setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.frost, true);
          farQueue.push(nodes);
          return;
        }

        // Выход из far/lite: плавный reveal (не снимать far в том же кадре, что blur).
        if (wasFar || nodes.section.hasAttribute(PANEL_STATE_ATTR.blurLite)) {
          revealQueue.push(nodes);
          if (isOn) paintPanelVeil(nodes.section, 0, radius);
          else {
            nodes.section.style.removeProperty(PANEL_VEIL_VAR);
            nodes.section.style.setProperty(PANEL_BLUR_RADIUS_VAR, `${radius}px`);
          }
          return;
        }

        paintBlurLiteFlag(nodes.section, wantLite);
        if (isOn) {
          paintPanelVeil(nodes.section, 0, radius);
          rememberPanelIntrinsicHeight(nodes.scroll);
        } else {
          nodes.section.style.removeProperty(PANEL_VEIL_VAR);
          nodes.section.style.setProperty(PANEL_BLUR_RADIUS_VAR, `${radius}px`);
        }
      });

      // Reveal near: по 1 панели / кадр после готовности контента.
      void (async () => {
        for (const nodes of revealQueue) {
          if (revealGen !== revealGenRef.current) return;
          await revealPanelFromFrost(nodes.section, nodes.scroll);
          if (revealGen !== revealGenRef.current) return;
        }
      })();

      // Far attrs батчами — не в кадре near-reveal.
      let cursor = 0;
      const pumpFar = () => {
        if (revealGen !== revealGenRef.current) return;
        const slice = farQueue.slice(cursor, cursor + FAR_BLUR_BATCH);
        cursor += FAR_BLUR_BATCH;
        for (const nodes of slice) {
          const id = nodes.section.id as SectionId;
          const i = sectionIds.indexOf(id);
          setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.far, true);
          paintBlurLiteFlag(nodes.section, true);
          nodes.section.style.removeProperty(PANEL_VEIL_VAR);
          paintPanelVeil(
            nodes.section,
            idleVeilAmount(i, index),
            panelBlurPxForScale(effectivePanelScale(i, index)),
          );
        }
        if (cursor < farQueue.length) {
          farBlurRafRef.current = requestAnimationFrame(pumpFar);
        } else {
          farBlurRafRef.current = 0;
        }
      };
      if (farQueue.length) {
        farBlurRafRef.current = requestAnimationFrame(pumpFar);
      }
    },
    [sectionIds],
  );

  /**
   * Линейный режим: раскладка карточного стека.
   * delta 0 — текущая; >0 снизу (всплывает); <0 уходит назад/вверх.
   */
  const markAccessibleCards = useCallback(
    (index: number) => {
      sectionIds.forEach((id, i) => {
        const nodes = panelsRef.current.get(id);
        if (!nodes) return;
        const isOn = i === index;
        const delta = i - index;
        setCardDeltaAttr(nodes.section, delta);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.active, isOn);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.ahead, false);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.far, false);
        if (nodes.section.style.filter) nodes.section.style.filter = "";
        nodes.section.style.removeProperty("--panel-veil");
        nodes.section.style.removeProperty("--panel-blur-radius");
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.blurLite, false);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.frost, false);
        setPanelStateAttr(nodes.section, PANEL_STATE_ATTR.revealing, false);

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
    // Только у реально активных scroll-box — не трогаем уже заблокированные.
    panelsRef.current.forEach(({ scroll }) => {
      const wasScrollable = scroll.hasAttribute(PANEL_STATE_ATTR.scrollable);
      if (wasScrollable) setPanelStateAttr(scroll, PANEL_STATE_ATTR.scrollable, false);
      if (scroll.style.pointerEvents !== "none") scroll.style.pointerEvents = "none";
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

  /**
   * Перед длинным ходом: прогреть dest ±1 (content-visibility + decode),
   * по одной панели за кадр — без массового layout в старте твина.
   */
  /** Idle: запечь панели по одной (текстуры для длинного reverse). */
  const schedulePanelBakes = useCallback(() => {
    if (isAccessible) return;
    if (bakeIdleRef.current) return;
    let cursor = 0;
    const pump = () => {
      bakeIdleRef.current = 0;
      if (cursor >= sectionIds.length) {
        if (import.meta.env.DEV) {
          console.info(`[bake] cache ~${Math.round(estimateBakeCacheBytes() / 1024)} KB`);
        }
        return;
      }
      const id = sectionIds[cursor];
      cursor += 1;
      const nodes = id ? panelsRef.current.get(id) : undefined;
      if (nodes && id) bakeAndAttachPanel(id, nodes.section);
      if (typeof window.requestIdleCallback === "function") {
        bakeIdleRef.current = window.requestIdleCallback(pump, { timeout: 400 });
      } else {
        bakeIdleRef.current = window.setTimeout(pump, 32);
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      bakeIdleRef.current = window.requestIdleCallback(pump, { timeout: 400 });
    } else {
      bakeIdleRef.current = window.setTimeout(pump, 48);
    }
  }, [isAccessible, sectionIds]);

  const prepareJump = useCallback(
    async (destIndex: number) => {
      const idxs = [destIndex - 1, destIndex, destIndex + 1].filter(
        (i) => i >= 0 && i < sectionIds.length,
      );
      const batch: PanelNodes[] = [];
      for (const i of idxs) {
        const id = sectionIds[i];
        const nodes = id ? panelsRef.current.get(id) : undefined;
        if (nodes) batch.push(nodes);
      }
      // Canvas-bake синхронный и дешёвый — добиваем кэш до старта (без лишних кадров).
      for (const id of sectionIds) {
        const nodes = panelsRef.current.get(id);
        if (nodes) bakeAndAttachPanel(id, nodes.section);
      }
      await warmPanelsForJump(batch);
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
      schedulePanelBakes();
      // Первый mount в accessible (до DomEffects) — выставляем delta на этой панели.
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
      }
      return () => {
        panelsRef.current.delete(id);
      };
    },
    [theme, isAccessible, sectionIds, currentIndexRef, schedulePanelBakes],
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
