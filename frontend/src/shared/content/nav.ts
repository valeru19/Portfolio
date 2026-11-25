import type { LocalizedString } from "@/shared/i18n";

export const nav = {
  about: { ru: "Обо мне", en: "About" } satisfies LocalizedString,
  stack: { ru: "Стек", en: "Stack" } satisfies LocalizedString,
  experience: { ru: "Опыт", en: "Experience" } satisfies LocalizedString,
  projects: { ru: "Проекты", en: "Projects" } satisfies LocalizedString,
  education: { ru: "Образование", en: "Education" } satisfies LocalizedString,
  reviews: { ru: "Отзывы", en: "Reviews" } satisfies LocalizedString,
  apply: { ru: "Заявка", en: "Apply" } satisfies LocalizedString,
  contacts: { ru: "Контакты", en: "Contacts" } satisfies LocalizedString,
  menuOpen: { ru: "Открыть меню", en: "Open menu" } satisfies LocalizedString,
  menuClose: { ru: "Закрыть меню", en: "Close menu" } satisfies LocalizedString,
  themeLight: { ru: "Светлая тема", en: "Light theme" } satisfies LocalizedString,
  themeDark: { ru: "Тёмная тема", en: "Dark theme" } satisfies LocalizedString,
  langSwitch: {
    ru: "Switch to English",
    en: "Переключить на русский",
  } satisfies LocalizedString,
} as const;
