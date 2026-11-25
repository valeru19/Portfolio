import { hasPrivacyContactChannel, isApiConfigured } from "@/shared/config";

/** All possible section anchors in page order. */
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
  /** Email / Telegram / LinkedIn channel required for forms that collect personal data. */
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
  // hero is 0 in the list; labeled sections start at 01 for about
  return String(index).padStart(2, "0");
}
