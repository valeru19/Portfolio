import type { LocalizedString } from "@/shared/i18n";

export const spiral = {
  scroll: { ru: "Дальше", en: "Next" } satisfies LocalizedString,
  accessibleOn: { ru: "Обычный скролл", en: "Normal scroll" } satisfies LocalizedString,
  accessibleOff: { ru: "Спираль", en: "Spiral" } satisfies LocalizedString,
  of: { ru: "из", en: "of" } satisfies LocalizedString,
} as const;
