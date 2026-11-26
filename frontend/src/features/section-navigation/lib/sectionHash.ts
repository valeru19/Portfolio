import type { SectionId } from "@/shared/content";

/** Читает #sectionId из location; неизвестный → null. */
export function sectionIndexFromHash(
  hash: string,
  sectionIds: readonly SectionId[],
): number | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  const id = raw.toLowerCase();
  const index = sectionIds.findIndex((s) => s === id);
  return index >= 0 ? index : null;
}

/** replaceState без новой записи истории. */
export function replaceSectionHash(sectionId: SectionId): void {
  if (typeof window === "undefined") return;
  const next = `#${sectionId}`;
  if (window.location.hash === next) return;
  const url = `${window.location.pathname}${window.location.search}${next}`;
  window.history.replaceState(window.history.state, "", url);
}
