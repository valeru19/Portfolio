import type { LocalizedString } from "@/shared/i18n";

export const a11y = {
  skipToContent: {
    ru: "Перейти к содержимому",
    en: "Skip to content",
  } satisfies LocalizedString,
  siteNav: {
    ru: "Сайт",
    en: "Site",
  } satisfies LocalizedString,
  sectionsNav: {
    ru: "Разделы",
    en: "Sections",
  } satisfies LocalizedString,
} as const;
