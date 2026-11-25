type GsapModule = typeof import("gsap");

let gsapLoadPromise: Promise<GsapModule["gsap"]> | null = null;

/**
 * Dynamically import GSAP. Call only when spiral mode is active and
 * prefers-reduced-motion is off — keeps GSAP out of the accessible entry chunk.
 */
export function loadGsap(): Promise<GsapModule["gsap"]> {
  if (!gsapLoadPromise) {
    gsapLoadPromise = import("gsap").then((mod) => {
      const gsap = mod.gsap;
      gsap.ticker.lagSmoothing(500, 33);
      gsap.config({ force3D: true });
      return gsap;
    });
  }
  return gsapLoadPromise;
}

/** Test helper — clears the cached promise between cases. */
export function resetGsapLoader(): void {
  gsapLoadPromise = null;
}
