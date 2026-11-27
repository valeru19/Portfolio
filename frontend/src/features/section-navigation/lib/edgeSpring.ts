import { EDGE_SPRING_DEG, EDGE_SPRING_MS } from "../model/constants";
import { spiralScaleFromRotation } from "../model/geometry";

import { paintSpiralElement, resetSpiralPaintCache } from "./spiralTransform";

export type EdgeSpringController = {
  anim: Animation | null;
  busy: boolean;
};

/**
 * Пружина на краю ленты: чуть вперёд и обратно.
 * Меняет только transform спирали (WAAPI), без видов/цветов/HUD/hash.
 */
export function playEdgeSpringAnimation(opts: {
  spiral: HTMLElement;
  baseRotation: number;
  controller: EdgeSpringController;
  clearGsapTransform?: (spiral: HTMLElement) => void;
}): void {
  const { spiral, baseRotation, controller, clearGsapTransform } = opts;
  const peakR = baseRotation - EDGE_SPRING_DEG;
  const baseScale = spiralScaleFromRotation(baseRotation);
  const peakScale = spiralScaleFromRotation(peakR);
  const tf = (r: number, s: number) => `rotate(${r}deg) scale(${s}) translate3d(0,0,0)`;

  cancelEdgeSpringAnimation(controller, spiral, baseRotation);
  clearGsapTransform?.(spiral);
  resetSpiralPaintCache();
  controller.busy = true;

  const anim = spiral.animate(
    [
      { transform: tf(baseRotation, baseScale) },
      { transform: tf(peakR, peakScale), offset: 0.38 },
      { transform: tf(baseRotation, baseScale) },
    ],
    {
      duration: EDGE_SPRING_MS,
      easing: "cubic-bezier(0.22, 1.15, 0.36, 1)",
      fill: "forwards",
    },
  );
  controller.anim = anim;
  const finish = () => {
    if (controller.anim !== anim) return;
    controller.anim = null;
    controller.busy = false;
    paintSpiralElement(spiral, baseRotation);
  };
  anim.onfinish = finish;
  anim.oncancel = () => {
    // Только сброс ссылки: paint делает cancelEdgeSpringAnimation
    // (иначе sync cancel → busy=false → paint пропускается).
    if (controller.anim === anim) controller.anim = null;
  };
}

/** Отмена пружины и возврат transform к baseRotation. */
export function cancelEdgeSpringAnimation(
  controller: EdgeSpringController,
  spiral: HTMLElement | null,
  baseRotation: number,
): void {
  const wasActive = controller.busy || controller.anim != null;
  if (controller.anim) {
    controller.anim.cancel();
    controller.anim = null;
  }
  controller.busy = false;
  if (!wasActive) return;
  if (spiral) {
    resetSpiralPaintCache();
    paintSpiralElement(spiral, baseRotation);
  }
}
