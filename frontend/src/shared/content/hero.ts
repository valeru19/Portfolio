import type { LocalizedString } from "@/shared/i18n";

export const hero = {
  subtitle: {
    ru: "Проектирую и пишу серверные системы на Python и FastAPI, Telegram Mini App и внутренние сервисы: от ТЗ до продакшена",
    en: "I design and build Python/FastAPI server systems, Telegram Mini Apps and internal services: from requirements to production",
  } satisfies LocalizedString,
  ctaContact: { ru: "Связаться", en: "Contact" } satisfies LocalizedString,
  ctaResume: { ru: "Резюме на hh.ru", en: "Resume on hh.ru" } satisfies LocalizedString,
  tagline: {
    ru: "Спека · Архитектура · Продакшен",
    en: "Specs · Architecture · Production",
  } satisfies LocalizedString,
  scrollHint: { ru: "Листать", en: "Scroll" } satisfies LocalizedString,
  workLabel: {
    ru: "работы, которые я делаю",
    en: "the kind of work I do",
  } satisfies LocalizedString,
} as const;
