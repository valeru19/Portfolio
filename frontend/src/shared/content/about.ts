import type { LocalizedString, LocalizedStringList } from "@/shared/i18n";

export const about = {
  title: { ru: "Обо мне", en: "About" } satisfies LocalizedString,
  text: {
    ru: [
      "Бэкенд-разработчик, бывший системный аналитик. Умею превращать размытую задачу в ТЗ, диаграммы и критерии приёмки, а затем реализовать её в коде.",
      "Проектирую архитектуру, пишу серверный код на Python и FastAPI и довожу системы до продакшена — аналитик и бэкендер в одном лице.",
      "Магистратура по машинному обучению. Преподаю информатику и математику: это помогает объяснять сложное простым языком и декомпозировать задачи.",
      "4+ года в образовании и IT-проектах.",
    ],
    en: [
      "Backend developer and former systems analyst. I turn vague requests into specs, diagrams and acceptance criteria — then implement them in code.",
      "I design architecture, write Python/FastAPI server code and ship systems to production — analyst and backend engineer in one.",
      "Master’s track in machine learning. I teach computer science and math, which helps me explain complex ideas clearly and break work into steps.",
      "4+ years in education and IT projects.",
    ],
  } satisfies LocalizedStringList,
  /** Значение `projects` подставляется в content/index.ts из projects.items.length. */
  stats: [
    { id: "years", value: "4+", label: { ru: "года опыта", en: "years of experience" } },
    { id: "projects", value: "0", label: { ru: "проекта", en: "key projects" } },
    { id: "roles", value: "2", label: { ru: "роли в одном", en: "roles in one" } },
  ] as const,
} as const;
