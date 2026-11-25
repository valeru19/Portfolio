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
      // Cap catch-up after a stall so a long task doesn't teleport the spiral.
      gsap.ticker.lagSmoothing(500, 33);
      // "auto": promote while tweening, release the layer after — permanent
      // force3D:true keeps every panel on the GPU and causes layer thrash.
      gsap.config({ force3D: "auto" });
      return gsap;
    });
  }
  return gsapLoadPromise;
}

/** Test helper — clears the cached promise between cases. */
export function resetGsapLoader(): void {
  gsapLoadPromise = null;
}
