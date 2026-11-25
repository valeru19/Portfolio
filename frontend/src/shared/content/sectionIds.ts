/** Static section anchors for accessible (vertical) layout — step 4. */
export const STATIC_SECTION_IDS = [
  "hero",
  "about",
  "stack",
  "experience",
  "projects",
  "education",
  "contacts",
] as const;

export type StaticSectionId = (typeof STATIC_SECTION_IDS)[number];

export const SECTION_INDEX_LABELS: Record<Exclude<StaticSectionId, "hero">, string> = {
  about: "01",
  stack: "02",
  experience: "03",
  projects: "04",
  education: "05",
  contacts: "06",
};
