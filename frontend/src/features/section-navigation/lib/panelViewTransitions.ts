import { setPanelViewAttr, readPanelViewAttr } from "../model/panelView";
import { prefersReducedMotion } from "../model/prefersReducedMotion";

import { decodePanelImages, rememberPanelIntrinsicHeight } from "./panelReveal";
import {
  animateLayerOpacity,
  cancelLayerAnim,
  PANEL_VIEW_MS,
  readLayerOpacity,
  type LayerAnimHandle,
} from "./panelLayerAnimator";
import {
  applyViewInstant,
  clearCoverInline,
  clearVeilInline,
  nextFrame,
  paintViewRadius,
  solidCoverOf,
  veilOf,
  type PanelNodesLike,
} from "./panelViewDom";

let viewGen = 0;

export function bumpPanelViewGeneration(): number {
  viewGen += 1;
  return viewGen;
}

export function currentPanelViewGeneration(): number {
  return viewGen;
}

export function resetPanelViewGenerationForTests(): void {
  viewGen = 0;
}

export function forceSolidInstant(nodes: PanelNodesLike): void {
  applyViewInstant(nodes.section, "solid");
}

/**
 * Под непрозрачной заливкой: контент + вуаль (для i+2 / dest+1).
 * Cover остаётся 1, чтобы blur не был виден до fade.
 */
export async function prepareBlurUnderCover(nodes: PanelNodesLike): Promise<void> {
  const { section, scroll } = nodes;
  const cover = solidCoverOf(section);
  if (cover) cover.style.opacity = "1";
  setPanelViewAttr(section, "blur");
  paintViewRadius(section);
  clearVeilInline(section);
  await nextFrame();
  decodePanelImages(section);
  rememberPanelIntrinsicHeight(scroll);
  await nextFrame();
  if (cover) cover.style.opacity = "1";
}

/** Под заливкой готовим sharp (dest на Наверх). */
export async function prepareSharpUnderCover(nodes: PanelNodesLike): Promise<void> {
  const { section, scroll } = nodes;
  const cover = solidCoverOf(section);
  if (cover) cover.style.opacity = "1";
  setPanelViewAttr(section, "sharp");
  paintViewRadius(section);
  clearVeilInline(section);
  await nextFrame();
  decodePanelImages(section);
  rememberPanelIntrinsicHeight(scroll);
  await nextFrame();
  if (cover) cover.style.opacity = "1";
}

/** solid → blur: контент+вуаль под cover, затем cover 1→0. */
export async function transitionSolidToBlur(
  nodes: PanelNodesLike,
  gen: number,
  durationMs = PANEL_VIEW_MS,
): Promise<void> {
  if (gen !== viewGen) return;
  await prepareBlurUnderCover(nodes);
  if (gen !== viewGen) return;
  const cover = solidCoverOf(nodes.section);
  if (!cover) return;
  if (prefersReducedMotion()) {
    cover.style.opacity = "0";
    return;
  }
  await animateLayerOpacity(cover, 0, durationMs);
}

/** Любой вид → solid: cover → 1, затем solid. */
export async function transitionToSolid(
  nodes: PanelNodesLike,
  gen: number,
  durationMs: number,
): Promise<void> {
  if (gen !== viewGen) return;
  const { section } = nodes;
  const cover = solidCoverOf(section);
  const current = readPanelViewAttr(section) ?? "solid";
  if (current === "solid" && cover && readLayerOpacity(cover) >= 0.99) return;
  if (!cover) {
    applyViewInstant(section, "solid");
    return;
  }
  await animateLayerOpacity(cover, 1, durationMs);
  if (gen !== viewGen) return;
  setPanelViewAttr(section, "solid");
  paintViewRadius(section);
  clearVeilInline(section);
}

/**
 * Сразу solid (контент выкл), заливка 0→1 с текущей opacity.
 * Для «Наверх» from: не прятать контент на пике scale-up.
 */
export async function transitionToSolidContentFirst(
  nodes: PanelNodesLike,
  gen: number,
  durationMs: number,
): Promise<void> {
  if (gen !== viewGen) return;
  const { section } = nodes;
  const cover = solidCoverOf(section);
  if (!cover) {
    applyViewInstant(section, "solid");
    return;
  }
  const from = readLayerOpacity(cover);
  cover.style.opacity = String(from);
  setPanelViewAttr(section, "solid");
  paintViewRadius(section);
  clearVeilInline(section);
  if (gen !== viewGen) return;
  await animateLayerOpacity(cover, 1, durationMs);
}

/** solid → sharp: контент под cover, cover → 0. */
export async function transitionSolidToSharp(
  nodes: PanelNodesLike,
  gen: number,
  durationMs: number,
  opts?: { /** Контент уже decode под cover (ring-next) — fade сразу, без 2 кадров паузы. */ ready?: boolean },
): Promise<void> {
  if (gen !== viewGen) return;
  const { section, scroll } = nodes;
  const cover = solidCoverOf(section);
  if (!cover) {
    applyViewInstant(section, "sharp");
    return;
  }
  // Продолжаем с фактической opacity (без принудительного 0.99 — иначе скачок при прерывании).
  const coverStart = readLayerOpacity(cover);
  cover.style.opacity = String(coverStart);
  setPanelViewAttr(section, "sharp");
  paintViewRadius(section);
  clearVeilInline(section);
  if (!opts?.ready) {
    await nextFrame();
    if (gen !== viewGen) return;
    decodePanelImages(section);
    rememberPanelIntrinsicHeight(scroll);
    await nextFrame();
    if (gen !== viewGen) return;
  } else {
    rememberPanelIntrinsicHeight(scroll);
  }
  await animateLayerOpacity(cover, 0, durationMs);
}

/** sharp → blur напрямую: cover = 0 весь переход, вуаль 0→1. */
export function transitionSharpToBlur(section: HTMLElement, durationMs: number): LayerAnimHandle {
  clearCoverInline(section, 0);
  const veil = veilOf(section);
  // Сначала inline 0: иначе после data-panel-view=blur CSS даёт opacity 1 и анимация 1→1.
  if (veil) {
    cancelLayerAnim(veil);
    veil.style.opacity = "0";
  }
  setPanelViewAttr(section, "blur");
  paintViewRadius(section);
  if (!veil || prefersReducedMotion()) {
    clearVeilInline(section);
    return { cancel: () => undefined };
  }
  let cancelled = false;
  void animateLayerOpacity(veil, 1, durationMs).then(() => {
    if (cancelled) return;
    // Сброс inline → CSS / hover через --panel-veil.
    veil.style.opacity = "";
  });
  return {
    cancel: () => {
      cancelled = true;
      cancelLayerAnim(veil);
    },
  };
}

/** blur → sharp: вуаль 1→0 при живом backdrop, затем sharp. */
export function transitionBlurToSharp(section: HTMLElement, durationMs: number): LayerAnimHandle {
  clearCoverInline(section, 0);
  setPanelViewAttr(section, "blur");
  paintViewRadius(section);
  const veil = veilOf(section);
  if (!veil || prefersReducedMotion()) {
    applyViewInstant(section, "sharp");
    return { cancel: () => undefined };
  }
  let cancelled = false;
  void animateLayerOpacity(veil, 0, durationMs).then(() => {
    if (cancelled) return;
    setPanelViewAttr(section, "sharp");
    paintViewRadius(section);
    veil.style.opacity = "";
  });
  return {
    cancel: () => {
      cancelled = true;
      cancelLayerAnim(veil);
    },
  };
}

/** Cover fade 1→0 (уже подготовленный blur под заливкой). */
export async function fadeCoverToReveal(
  section: HTMLElement,
  gen: number,
  durationMs: number,
): Promise<void> {
  if (gen !== viewGen) return;
  const cover = solidCoverOf(section);
  if (!cover) return;
  await animateLayerOpacity(cover, 0, durationMs);
}
