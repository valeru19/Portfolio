export function prefersReducedMotion(
  matchMediaFn: (query: string) => { matches: boolean } = window.matchMedia.bind(window),
): boolean {
  return matchMediaFn("(prefers-reduced-motion: reduce)").matches;
}
