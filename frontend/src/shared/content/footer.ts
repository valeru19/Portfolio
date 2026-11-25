import type { LocalizedString } from "@/shared/i18n";

export const footer = {
  top: { ru: "Наверх", en: "Back to top" } satisfies LocalizedString,
  rights: {
    ru: "Лендинг-резюме · правки только в CONTENT",
    en: "Resume landing · edit CONTENT only",
  } satisfies LocalizedString,
} as const;
