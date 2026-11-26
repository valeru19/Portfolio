import type { SectionId } from "@/shared/content";

import { SPIRAL_FLIP_DURATION_MS } from "../model/constants";
import {
  computeSpiralLayout,
  panelRotationAtIndex,
  panelScaleAtIndex,
  spiralScaleFromRotation,
} from "../model/geometry";

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
export function applySpiralLayoutToPanels(
  spiral: HTMLElement,
  sectionIds: SectionId[],
  panels: Map<SectionId, PanelNodes>,
  gsap: GsapLike | null,
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
    const rotation = panelRotationAtIndex(index);
    const scale = panelScaleAtIndex(index);
    const pose = `rotate(${rotation}deg) scale(${scale}) translate3d(0,0,0)`;
    if (nodes.section.style.transform !== pose) {
      nodes.section.style.transform = pose;
    }
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
  // Прыжок через несколько секций. Reverse длиннее и ровнее (шаг 17): меньше
  // «рывков» в начале, где scale-up × эффекты били по кадрам.
  const perStep = goingBack ? 0.28 : 0.22;
  const floor = goingBack ? 1.15 : 0.9;
  const ceiling = goingBack ? 2.15 : 1.7;
  return Math.min(ceiling, Math.max(floor, 0.55 + steps * perStep));
}

/**
 * 1 шаг: sine.inOut (LOCKED).
 * Длинный reverse: sine.inOut — ровнее power2.out (шаг 17).
 * Длинный forward: power2.out.
 */
export function animationEase(distanceDeg: number, goingBack: boolean): string {
  const steps = Math.max(1, distanceDeg / 90);
  if (steps <= 1.01) return "sine.inOut";
  if (goingBack) return "sine.inOut";
  return "power2.out";
}
