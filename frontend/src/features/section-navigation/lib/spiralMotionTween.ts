import type { loadGsap } from "./loadGsap";
import { paintSpiralElementWithGsap } from "./spiralTransform";

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
 * Единый GSAP-твин вращения спирали для обычного шага и хода через круг.
 * Поведение кадра/посадки задаётся колбэками вызывающего кода.
 */
export function runSpiralRotationTween(opts: SpiralTweenOptions): void {
  const { gsap, spiral, startR, endR, duration, ease, refs, onFrame, nearLand, onComplete } = opts;
  if (!refs.isCurrent()) return;

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
        paintSpiralElementWithGsap(gsap, spiral, state.r);
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
        onComplete();
      },
    }),
  );
}
