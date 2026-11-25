import type { LocalizedString } from "@/shared/i18n";

export type StackItem = {
  label: string;
  logo?: string;
};

export type StackGroup = {
  name: LocalizedString;
  items: StackItem[];
};

export const stack = {
  title: { ru: "Стек", en: "Stack" } satisfies LocalizedString,
  groups: [
    {
      name: { ru: "Backend", en: "Backend" },
      items: [
        { label: "Python 3.12", logo: "python" },
        { label: "Java", logo: "java" },
        { label: "C#", logo: "csharp" },
        { label: "FastAPI", logo: "fastapi" },
        { label: "SQLAlchemy 2.0", logo: "sqlalchemy" },
        { label: "Pydantic" },
        { label: "aiogram 3" },
        { label: "arq" },
        { label: "Celery", logo: "celery" },
        { label: "Maven", logo: "maven" },
        { label: "Dishka" },
        { label: "Poetry" },
      ],
    },
    {
      name: { ru: "Frontend", en: "Frontend" },
      items: [
        { label: "HTML5", logo: "html5" },
        { label: "JavaScript", logo: "javascript" },
        { label: "TypeScript", logo: "typescript" },
        { label: "React", logo: "react" },
        { label: "Angular", logo: "angular" },
        { label: "Vite" },
        { label: "TanStack Query/Router" },
        { label: "shadcn/ui" },
        { label: "Feature Sliced Design" },
      ],
    },
    {
      name: { ru: "Данные и инфраструктура", en: "Data & infrastructure" },
      items: [
        { label: "PostgreSQL", logo: "postgresql" },
        { label: "Redis", logo: "redis" },
        { label: "Docker Compose", logo: "docker" },
        { label: "Nginx", logo: "nginx" },
        { label: "GitHub", logo: "github" },
      ],
    },
    {
      name: { ru: "Безопасность", en: "Security" },
      items: [{ label: "JWT" }, { label: "Telegram initData (HMAC-SHA256)" }],
    },
    {
      name: { ru: "Аналитика и документация", en: "Analytics & docs" },
      items: [
        { label: "ТЗ / Specs" },
        { label: "C4" },
        { label: "PlantUML" },
        { label: "ER (ГОСТ)" },
        { label: "Use case" },
      ],
    },
  ] satisfies StackGroup[],
} as const;
