import { hasPrivacyContactChannel, isApiConfigured } from "@/shared/config";

/** Все якоря секций в порядке страницы. */
export const ALL_SECTION_IDS = [
  "hero",
  "about",
  "stack",
  "experience",
  "projects",
  "education",
  "reviews",
  "apply",
  "contacts",
] as const;

export type SectionId = (typeof ALL_SECTION_IDS)[number];

const API_ONLY_SECTIONS = new Set<SectionId>(["reviews", "apply"]);

export type SectionVisibilityOptions = {
  apiEnabled?: boolean;
  /** Канал Email / Telegram / LinkedIn обязателен для форм с ПДн. */
  hasContactChannel?: boolean;
};

export function getVisibleSectionIds(options: SectionVisibilityOptions = {}): SectionId[] {
  const apiEnabled = options.apiEnabled ?? isApiConfigured();
  const contactChannelAvailable =
    options.hasContactChannel ?? hasPrivacyContactChannel();
  const formsVisible = apiEnabled && contactChannelAvailable;

  return ALL_SECTION_IDS.filter((id) => {
    if (!API_ONLY_SECTIONS.has(id)) return true;
    return formsVisible;
  });
}

export function getSectionIndexLabel(
  sectionId: Exclude<SectionId, "hero">,
  visibleIds: SectionId[] = getVisibleSectionIds(),
): string {
  const index = visibleIds.indexOf(sectionId);
  if (index < 0) return "00";
  // hero = 0 в списке; подписи секций начинаются с 01 у about
  return String(index).padStart(2, "0");
}
