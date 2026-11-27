import type { loadGsap } from "./loadGsap";
import { paintSpiralElement, resetSpiralPaintCache } from "./spiralTransform";

export type GsapLike = Awaited<ReturnType<typeof loadGsap>>;

export type SpiralTweenRefs = {
  motionGen: number;
  isCurrent: () => boolean;
  setTween: (tween: { kill: () => void } | null) => void;
  setRotation: (rotationDeg: number) => void;
};

export type SpiralTweenOptions = {
  gsap: NonNullable<GsapLike>;
  spiral: HTMLElement;
  startR: number;
  endR: number;
  duration: number;
  ease: string;
  refs: SpiralTweenRefs;
  /** Кадр твина после paint (прогресс HUD, near-land и т.п.). */
  onFrame?: (rotationDeg: number) => void;
  /** Когда осталось ≤ remainingDeg — вызвать один раз. */
  nearLand?: { remainingDeg: number; run: () => void };
  onComplete: () => void;
};

/**
 * Единый GSAP-твин угла спирали для обычного хода и хода через круг.
 * В DOM пишем CSS transform (не gsap rotation/scale): иначе при старте с
 * готового style.transform GSAP даёт skew(360)/ложный rotate и рывок-телепорт.
 */
export function runSpiralRotationTween(opts: SpiralTweenOptions): void {
  const { gsap, spiral, startR, endR, duration, ease, refs, onFrame, nearLand, onComplete } = opts;
  if (!refs.isCurrent()) return;

  // Снять GSAP-инлайн с прошлых твинов, зафиксировать старт CSS-строкой.
  gsap.set(spiral, { clearProps: "transform" });
  resetSpiralPaintCache();
  paintSpiralElement(spiral, startR);
  refs.setRotation(startR);

  const state = { r: startR };
  let nearLandDone = false;

  refs.setTween(
    gsap.to(state, {
      r: endR,
      duration,
      ease,
      overwrite: true,
      onUpdate: () => {
        if (!refs.isCurrent()) return;
        paintSpiralElement(spiral, state.r);
        refs.setRotation(state.r);
        onFrame?.(state.r);
        if (nearLand && !nearLandDone) {
          const remaining = Math.abs(endR - state.r);
          if (remaining <= nearLand.remainingDeg) {
            nearLandDone = true;
            nearLand.run();
          }
        }
      },
      onComplete: () => {
        if (!refs.isCurrent()) return;
        refs.setTween(null);
        if (nearLand && !nearLandDone) {
          nearLandDone = true;
          nearLand.run();
        }
        // Дожать точный endR (на случай long-task skip).
        paintSpiralElement(spiral, endR);
        refs.setRotation(endR);
        onComplete();
      },
    }),
  );
}
