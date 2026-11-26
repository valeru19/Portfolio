type GsapModule = typeof import("gsap");

let gsapLoadPromise: Promise<GsapModule["gsap"]> | null = null;

/**
 * Ленивый import GSAP. Вызывать только в режиме спирали и без
 * prefers-reduced-motion — так GSAP не попадает в accessible-чанк.
 */
export function loadGsap(): Promise<GsapModule["gsap"]> {
  if (!gsapLoadPromise) {
    gsapLoadPromise = import("gsap").then((mod) => {
      const gsap = mod.gsap;
      // Ограничиваем догон после лага, чтобы длинный таск не «телепортировал» спираль.
      gsap.ticker.lagSmoothing(500, 33);
      // "auto": слой на GPU только на время твина; постоянный force3D:true
      // держит все панели на GPU и даёт layer thrash.
      gsap.config({ force3D: "auto" });
      return gsap;
    });
  }
  return gsapLoadPromise;
}

/** Хелпер тестов — сброс кэша промиса между кейсами. */
export function resetGsapLoader(): void {
  gsapLoadPromise = null;
}
