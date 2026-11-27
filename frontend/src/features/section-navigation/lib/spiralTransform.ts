import type { SectionId } from "@/shared/content";

import { SPIRAL_FLIP_DURATION_MS } from "../model/constants";
import {
  computeSpiralLayout,
  panelRotationAtIndex,
  panelScaleAtIndex,
  spiralScaleFromRotation,
} from "../model/geometry";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

type PanelNodes = {
  section: HTMLElement;
  scroll: HTMLElement;
};

type GsapLike = {
  set: (target: object, vars: Record<string, unknown>) => void;
};

let lastSpiralTransform = "";
let lastGsapRotation = Number.NaN;
let lastGsapScale = Number.NaN;

/**
 * CSS-путь (без GSAP): одна compositor-only строка transform.
 * Повтор с тем же значением пропускаем — меньше style invalidation.
 */
export function paintSpiralElement(spiral: HTMLElement, rotationDeg: number): void {
  const scale = spiralScaleFromRotation(rotationDeg);
  // Чуть округляем, чтобы микрошум float не плодил уникальные строки каждый тик.
  const r = Math.round(rotationDeg * 1000) / 1000;
  const s = Math.round(scale * 1e6) / 1e6;
  const next = `rotate(${r}deg) scale(${s}) translate3d(0,0,0)`;
  if (next === lastSpiralTransform && spiral.style.transform === next) return;
  lastSpiralTransform = next;
  lastGsapRotation = Number.NaN;
  lastGsapScale = Number.NaN;
  spiral.style.transform = next;
}

/**
 * Hot path твина как в legacy: gsap.set(rotation/scale) на спирали.
 * Идемпотентно: повтор с теми же r/s не пишет в DOM.
 */
export function paintSpiralElementWithGsap(
  gsap: GsapLike,
  spiral: HTMLElement,
  rotationDeg: number,
): void {
  const scale = spiralScaleFromRotation(rotationDeg);
  const r = Math.round(rotationDeg * 1000) / 1000;
  const s = Math.round(scale * 1e6) / 1e6;
  if (r === lastGsapRotation && s === lastGsapScale) return;
  lastGsapRotation = r;
  lastGsapScale = s;
  // force3D:true на время твина — как legacy; стабильный compositor-слой спирали.
  gsap.set(spiral, { rotation: r, scale: s, force3D: true });
  // CSS-кэш невалиден: после твина finish снова может писать style.transform.
  lastSpiralTransform = "";
}

/** Сброс кэша строки transform (тесты / remount). */
export function resetSpiralPaintCache(): void {
  lastSpiralTransform = "";
  lastGsapRotation = Number.NaN;
  lastGsapScale = Number.NaN;
}

/**
 * Раскладка панелей. Позу пишем через CSS transform (не gsap.set на каждую панель) —
 * gsap.set на 7 узлах перед reverse/Наверх давал заметный hitch на старте твина.
 */
/**
 * Раскладка панелей по индексу слота.
 * `layoutIndexById` — временные слоты (ход через круг: dest на from+steps).
 */
export function applySpiralLayoutToPanels(
  spiral: HTMLElement,
  sectionIds: SectionId[],
  panels: Map<SectionId, PanelNodes>,
  gsap: GsapLike | null,
  layoutIndexById?: ReadonlyMap<SectionId, number>,
): void {
  const layout = computeSpiralLayout(window.innerWidth, window.innerHeight);
  const widthPx = `${layout.panelWidth}px`;
  const heightPx = `${layout.panelHeight}px`;

  spiral.style.transformOrigin = layout.transformOrigin;
  if (gsap) gsap.set(spiral, { transformOrigin: layout.transformOrigin });

  sectionIds.forEach((id, index) => {
    const nodes = panels.get(id);
    if (!nodes) return;
    if (nodes.section.style.width !== widthPx) nodes.section.style.width = widthPx;
    if (nodes.section.style.height !== heightPx) nodes.section.style.height = heightPx;
    if (nodes.section.style.transformOrigin !== layout.transformOrigin) {
      nodes.section.style.transformOrigin = layout.transformOrigin;
    }
    const slot = layoutIndexById?.get(id) ?? index;
    const rotation = panelRotationAtIndex(slot);
    const scale = panelScaleAtIndex(slot);
    const pose = `rotate(${rotation}deg) scale(${scale}) translate3d(0,0,0)`;
    if (nodes.section.style.transform !== pose) {
      nodes.section.style.transform = pose;
    }
  });

  paintInfinityGhosts(spiral, sectionIds, panels, layoutIndexById);
}

/**
 * Хвост «бесконечной» спирали: ghost-квадраты после реальных секций.
 * Если первая заняла слот N (кольцо на последней) — ghosts с N+1.
 *
 * Цвет/рамка по абсолютному слоту (slot % N), не по индексу ghost —
 * иначе на wrap last→first весь хвост сдвигается и квадраты перекрашиваются.
 */
export function paintInfinityGhosts(
  spiral: HTMLElement,
  sectionIds: readonly SectionId[],
  panels: Map<SectionId, PanelNodes>,
  layoutIndexById?: ReadonlyMap<SectionId, number>,
): void {
  const sectionCount = sectionIds.length;
  if (sectionCount <= 0) return;

  const layout = computeSpiralLayout(window.innerWidth, window.innerHeight);
  const widthPx = `${layout.panelWidth}px`;
  const heightPx = `${layout.panelHeight}px`;
  let firstSlot = sectionCount;
  if (layoutIndexById) {
    for (const slot of layoutIndexById.values()) {
      if (slot >= firstSlot) firstSlot = slot + 1;
    }
  }
  const ghosts = spiral.querySelectorAll<HTMLElement>(`[${SPIRAL_DOM_ATTR.ghost}]`);
  ghosts.forEach((el, i) => {
    const slot = firstSlot + i;
    if (el.style.width !== widthPx) el.style.width = widthPx;
    if (el.style.height !== heightPx) el.style.height = heightPx;
    if (el.style.transformOrigin !== layout.transformOrigin) {
      el.style.transformOrigin = layout.transformOrigin;
    }
    if (el.style.opacity !== "1") el.style.opacity = "1";
    if (el.style.visibility !== "visible") el.style.visibility = "visible";

    // Полная заливка слота (как flat-панель): цвет --panel, без видимой рамки.
    const colorId = sectionIds[((slot % sectionCount) + sectionCount) % sectionCount];
    const source = colorId ? panels.get(colorId)?.section : undefined;
    const fill = source?.style.getPropertyValue("--panel").trim() || el.style.background;
    if (fill && el.style.background !== fill) el.style.background = fill;
    if (el.style.borderStyle !== "none") el.style.border = "none";

    const pose = `rotate(${panelRotationAtIndex(slot)}deg) scale(${panelScaleAtIndex(slot)}) translate3d(0,0,0)`;
    if (el.style.transform !== pose) el.style.transform = pose;
  });
}

/**
 * Длительность твина (секунды).
 * 1 шаг — от SPIRAL_FLIP_DURATION_MS (locked); multi — чуть медленнее.
 */
export function animationDurationMs(distanceDeg: number, goingBack: boolean): number {
  const steps = Math.max(1, distanceDeg / 90);
  const singleCeiling = SPIRAL_FLIP_DURATION_MS / 1000;
  if (steps <= 1.01) {
    // LOCKED single-step — не менять без явного запроса.
    const ceiling = goingBack ? singleCeiling : singleCeiling - 0.04;
    const floor = goingBack ? 0.55 : 0.52;
    return Math.min(ceiling, Math.max(floor, 0.48 + distanceDeg / 500));
  }
  // Длинный ход (шаг 17): reverse ~2.0–2.2 с, ровный sine.inOut.
  const perStep = goingBack ? 0.28 : 0.22;
  const floor = goingBack ? 1.6 : 0.9;
  const ceiling = goingBack ? 2.2 : 1.7;
  return Math.min(ceiling, Math.max(floor, 0.55 + steps * perStep));
}

/**
 * 1 шаг: sine.inOut (LOCKED).
 * Длинный reverse: sine.inOut — ускорение к половине, замедление после.
 * Длинный forward: power2.out.
 */
export function animationEase(distanceDeg: number, goingBack: boolean): string {
  const steps = Math.max(1, distanceDeg / 90);
  if (steps <= 1.01) return "sine.inOut";
  if (goingBack) return "sine.inOut";
  return "power2.out";
}
