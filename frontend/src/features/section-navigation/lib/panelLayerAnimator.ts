import { prefersReducedMotion } from "../model/prefersReducedMotion";

/** Симметричный ease для cover/veil (экспоненциальный ease-out запрещён). */
export const PANEL_VIEW_EASE = "ease-in-out";
/** Длительность переходов вида (450–500 мс). */
export const PANEL_VIEW_MS = 480;
/** Быстрый уход старой blur в solid перед новой blur. */
export const PANEL_BLUR_HANDOFF_MS = 135;

const layerAnims = new WeakMap<HTMLElement, Animation>();

/**
 * Фактическая opacity слоя (с учётом WAAPI).
 * Перед чтением коммитит текущую анимацию в inline, чтобы не брать устаревший старт.
 */
export function readLayerOpacity(el: HTMLElement): number {
  const prev = layerAnims.get(el);
  if (prev) {
    try {
      // обоснование: WAAPI commitStyles есть не во всех типах DOM lib
      const withCommit = prev as Animation & { commitStyles?: () => void };
      withCommit.commitStyles?.();
    } catch {
      /* ignore */
    }
    try {
      prev.cancel();
    } catch {
      /* ignore */
    }
    layerAnims.delete(el);
  }
  const inline = el.style.opacity;
  if (inline !== "") {
    const n = Number(inline);
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n));
  }
  const computed = Number(getComputedStyle(el).opacity);
  return Number.isFinite(computed) ? Math.min(1, Math.max(0, computed)) : 0;
}

export function cancelLayerAnim(el: HTMLElement): void {
  const prev = layerAnims.get(el);
  if (!prev) return;
  try {
    const withCommit = prev as Animation & { commitStyles?: () => void };
    withCommit.commitStyles?.();
  } catch {
    /* ignore */
  }
  try {
    prev.cancel();
  } catch {
    /* ignore */
  }
  layerAnims.delete(el);
}

/**
 * Один аниматор на слой: продолжает с текущей opacity, без скачка.
 */
export function animateLayerOpacity(
  el: HTMLElement,
  to: number,
  durationMs: number,
): Promise<void> {
  const from = readLayerOpacity(el);
  const target = Math.min(1, Math.max(0, to));
  if (prefersReducedMotion() || typeof el.animate !== "function") {
    el.style.opacity = String(target);
    return Promise.resolve();
  }
  if (Math.abs(from - target) < 0.01) {
    el.style.opacity = String(target);
    return Promise.resolve();
  }
  el.style.willChange = "opacity";
  const anim = el.animate([{ opacity: from }, { opacity: target }], {
    duration: Math.max(16, durationMs),
    easing: PANEL_VIEW_EASE,
    fill: "forwards",
  });
  layerAnims.set(el, anim);
  return anim.finished
    .then(() => {
      el.style.opacity = String(target);
      el.style.willChange = "";
      layerAnims.delete(el);
      try {
        anim.cancel();
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      el.style.willChange = "";
      layerAnims.delete(el);
    });
}

export type LayerAnimHandle = { cancel: () => void };

export function animateLayerOpacityHandle(
  el: HTMLElement,
  to: number,
  durationMs: number,
): LayerAnimHandle {
  let cancelled = false;
  void animateLayerOpacity(el, to, durationMs).then(() => {
    /* settled */
  });
  return {
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      cancelLayerAnim(el);
    },
  };
}
