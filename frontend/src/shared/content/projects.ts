import type { LocalizedString, LocalizedStringList } from "@/shared/i18n";

export type ProjectItem = {
  name: LocalizedString | string;
  detail: "full" | "short";
  summary: LocalizedString;
  stack: string[];
  points: LocalizedStringList;
  code: string;
  demo: string;
};

export const projects = {
  title: { ru: "Проекты", en: "Projects" } satisfies LocalizedString,
  codeLabel: { ru: "Код", en: "Code" } satisfies LocalizedString,
  demoLabel: { ru: "Демо", en: "Demo" } satisfies LocalizedString,
  items: [
    {
      name: "AutoSpread",
      detail: "full",
      summary: {
        ru: "Система P2P-арбитража на Bybit в формате Telegram Mini App; денежные шаги подтверждает оператор.",
        en: "P2P arbitrage system on Bybit as a Telegram Mini App; an operator confirms money steps.",
      },
      stack: ["FastAPI", "aiogram 3", "arq", "PostgreSQL", "Redis", "React/TypeScript"],
      points: {
        ru: [
          "Спроектировал ТЗ, C4-диаграммы и схему БД; реализовал backend и очередь задач.",
          "Добавил симулятор биржи для безопасной отладки без реальных средств.",
          "Операторский контур подтверждает финансовые операции перед исполнением.",
        ],
        en: [
          "Authored specs, C4 diagrams and DB schema; built the backend and task queue.",
          "Added an exchange simulator for safe debugging without real funds.",
          "Operator flow confirms financial operations before execution.",
        ],
      },
      code: "",
      demo: "",
    },
    {
      name: {
        ru: "ВКР: Mini App деканата",
        en: "Thesis: Dean’s office Mini App",
      },
      detail: "full",
      summary: {
        ru: "Мини-приложение в мессенджере MAX для процессов деканата.",
        en: "Mini app in the MAX messenger for dean’s office workflows.",
      },
      stack: ["FastAPI", "React", "PostgreSQL", "Celery", "Redis", "Docker Compose", "Nginx"],
      points: {
        ru: [
          "Спроектировал и реализовал серверную часть с асинхронными задачами на Celery.",
          "Развернул стек через Docker Compose и Nginx с SSL.",
          "Связал frontend на React с API и хранилищем PostgreSQL/Redis.",
        ],
        en: [
          "Designed and built the server side with Celery async jobs.",
          "Deployed via Docker Compose and Nginx with SSL.",
          "Connected a React frontend to the API and PostgreSQL/Redis.",
        ],
      },
      code: "",
      demo: "",
    },
    {
      name: {
        ru: "Образовательные виджеты",
        en: "Educational widgets",
      },
      detail: "full",
      summary: {
        ru: "Интерактивные HTML/SVG-тренажёры по математике и информатике.",
        en: "Interactive HTML/SVG trainers for math and computer science.",
      },
      stack: ["HTML", "SVG", "JavaScript", "CSS"],
      points: {
        ru: [
          "Сделал тренажёры по геометрии, алгебре, комбинаторике и задачам по информатике.",
          "Использую виджеты на уроках и при подготовке к экзаменам.",
          "Фокус на наглядности: ученик видит результат действия сразу.",
        ],
        en: [
          "Built trainers for geometry, algebra, combinatorics and CS problems.",
          "Use the widgets in lessons and exam prep.",
          "Emphasis on immediacy: the student sees the result of each action right away.",
        ],
      },
      code: "",
      demo: "",
    },
    {
      name: "Xenia WMS",
      detail: "short",
      summary: {
        ru: "Система управления складом с KPI-дашбордами.",
        en: "Warehouse management system with KPI dashboards.",
      },
      stack: ["React/TypeScript", "FastAPI", "KPI dashboards"],
      points: {
        ru: [
          "Участвовал в разработке UI и API для складских процессов.",
          "Дашборды для контроля ключевых показателей.",
        ],
        en: [
          "Contributed to UI and API for warehouse workflows.",
          "Dashboards for tracking key performance indicators.",
        ],
      },
      code: "",
      demo: "",
    },
    {
      name: "Oraro",
      detail: "short",
      summary: {
        ru: "Telegram Mini App: объявления, работа, знакомства; защита сессий через initData.",
        en: "Telegram Mini App for listings, jobs and dating; session protection via initData.",
      },
      stack: ["Telegram Mini App", "initData", "HMAC-SHA256"],
      points: {
        ru: [
          "Реализовал защиту сессий через валидацию Telegram initData.",
          "Серверная логика для сценариев объявлений и взаимодействий пользователей.",
        ],
        en: [
          "Implemented session protection via Telegram initData validation.",
          "Server logic for listings and user interaction flows.",
        ],
      },
      code: "",
      demo: "",
    },
    {
      name: { ru: "Портфолио", en: "Portfolio" },
      detail: "short",
      summary: {
        ru: "Этот лендинг-резюме: секции, RU/EN, темы и формы заявок/отзывов.",
        en: "This resume landing: sections, RU/EN, themes, and application/review forms.",
      },
      stack: ["React", "TypeScript", "Vite", "FastAPI"],
      points: {
        ru: ["Репозиторий лендинга и связанного API."],
        en: ["Repository for the landing and related API."],
      },
      code: "https://github.com/valeru19/Portfolio",
      demo: "",
    },
  ] satisfies ProjectItem[],
} as const;
