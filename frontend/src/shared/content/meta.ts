import type { LocalizedString } from "../i18n/types";

export const meta = {
  name: {
    ru: "Кожин Валерий Алексеевич",
    en: "Valeriy Alekseevich Kozhin",
  } satisfies LocalizedString,
  brand: {
    ru: "В. Кожин",
    en: "V. Kozhin",
  } satisfies LocalizedString,
  monogram: "VK",
  role: {
    ru: "Backend-разработчик · системный аналитик",
    en: "Backend Developer · Systems Analyst",
  } satisfies LocalizedString,
  location: {
    ru: "Россия",
    en: "Russia",
  } satisfies LocalizedString,
  status: {
    ru: "Открыт к предложениям",
    en: "Open to opportunities",
  } satisfies LocalizedString,
  title: {
    ru: "Кожин Валерий Алексеевич — Backend-разработчик · системный аналитик",
    en: "Valeriy Kozhin — Backend Developer · Systems Analyst",
  } satisfies LocalizedString,
  description: {
    ru: "Кожин Валерий Алексеевич — Backend-разработчик и системный аналитик. Python, FastAPI, Telegram Mini App. От ТЗ до продакшена.",
    en: "Valeriy Kozhin — Backend developer and systems analyst. Python, FastAPI, Telegram Mini Apps. From requirements to production.",
  } satisfies LocalizedString,
  ogDescription: {
    ru: "Проектирую и пишу серверные системы на Python и FastAPI, Telegram Mini App и внутренние сервисы: от ТЗ до продакшена.",
    en: "I design and build Python/FastAPI server systems, Telegram Mini Apps and internal services — from requirements to production.",
  } satisfies LocalizedString,
} as const;
