import type { LocalizedString, LocalizedStringList } from "@/shared/i18n";

export type TechLogo = {
  id: string;
  name: string;
  src: string;
};

export type ExperienceItem = {
  role: LocalizedString;
  company: LocalizedString;
  dates: LocalizedString;
  points: LocalizedStringList;
};

export const experience = {
  title: { ru: "Опыт", en: "Experience" } satisfies LocalizedString,
  techTitle: {
    ru: "Технологический стек",
    en: "Technology stack",
  } satisfies LocalizedString,
  osTitle: {
    ru: "ОС",
    en: "Operating systems",
  } satisfies LocalizedString,
  distroTitle: {
    ru: "Дистрибутивы Linux",
    en: "Linux distributions",
  } satisfies LocalizedString,
  items: [
    {
      role: { ru: "Backend Developer", en: "Backend Developer" },
      company: { ru: "NextCore Consulting", en: "NextCore Consulting" },
      dates: { ru: "февраль 2026 — н.в.", en: "Feb 2026 — present" },
      points: {
        ru: [
          "Разрабатываю, тестирую и поддерживаю серверный код коммерческих продуктов и платформы AI-Analyze.",
          "Исправляю баги, настраиваю мониторинг и работаю с базами данных в продакшен-окружении.",
          "Формализую задачи от клиентов: от формулировки требований до реализации и сопровождения.",
        ],
        en: [
          "Develop, test and maintain server-side code for commercial products and the AI-Analyze platform.",
          "Fix bugs, set up monitoring and work with production databases.",
          "Formalize client tasks: from requirements wording through implementation and support.",
        ],
      },
    },
    {
      role: { ru: "Системный аналитик", en: "Systems Analyst" },
      company: { ru: "PARMA Technologies Group", en: "PARMA Technologies Group" },
      dates: { ru: "февраль 2025 — январь 2026", en: "Feb 2025 — Jan 2026" },
      points: {
        ru: [
          "Анализировал требования и формулировал требования к базам данных и архитектуре систем.",
          "Проверял бизнес-правила и соответствие законодательству.",
          "Готовил документацию и критерии приёмки для передачи в разработку.",
        ],
        en: [
          "Analyzed requirements and defined database and system architecture needs.",
          "Validated business rules and regulatory compliance.",
          "Prepared documentation and acceptance criteria for handoff to engineering.",
        ],
      },
    },
    {
      role: { ru: "Преподаватель и репетитор", en: "Tutor" },
      company: { ru: "Самостоятельно", en: "Independent" },
      dates: { ru: "2022 — н.в. (4+ года)", en: "2022 — present (4+ years)" },
      points: {
        ru: [
          "Преподаю математику, высшую математику и программирование школьникам и студентам; готовлю к ОГЭ, ЕГЭ и олимпиадам.",
          "Выстраиваю индивидуальную программу под цель и уровень ученика: аналог сбора требований и декомпозиции задачи.",
          "Объясняю алгоритмы, структуры данных и основы программирования ученикам с разной подготовкой.",
          "Разрабатываю интерактивные учебные виджеты на HTML/SVG и веду работу итерациями с проверкой результата.",
        ],
        en: [
          "Teaching mathematics, higher mathematics and programming to school and university students; preparing them for national exams and olympiads.",
          "Building interactive HTML/SVG learning tools.",
          "Skilled at breaking complex topics into clear steps for audiences with different backgrounds.",
          "Work in regular iterations with homework and progress checks — similar to requirements gathering and delivery cycles.",
        ],
      },
    },
  ] satisfies ExperienceItem[],
  techLogos: [
    { id: "python", name: "Python", src: "assets/python.png" },
    { id: "java", name: "Java", src: "assets/java.png" },
    { id: "csharp", name: "C#", src: "assets/csharp.png" },
    { id: "fastapi", name: "FastAPI", src: "assets/fastapi.png" },
    { id: "sqlalchemy", name: "SQLAlchemy", src: "assets/sqlalchemy-sa.png" },
    { id: "alembic", name: "Alembic", src: "assets/alembic.png" },
    { id: "celery", name: "Celery", src: "assets/celery.png" },
    { id: "maven", name: "Maven", src: "assets/maven.png" },
    { id: "html5", name: "HTML5", src: "assets/html5.png" },
    { id: "javascript", name: "JavaScript", src: "assets/javascript.png" },
    { id: "typescript", name: "TypeScript", src: "assets/typescript.png" },
    { id: "react", name: "React", src: "assets/react.png" },
    { id: "angular", name: "Angular", src: "assets/angular.png" },
    { id: "postgresql", name: "PostgreSQL", src: "assets/postgresql.png" },
    { id: "redis", name: "Redis", src: "assets/redis.png" },
    { id: "docker", name: "Docker", src: "assets/docker.png" },
    { id: "nginx", name: "Nginx", src: "assets/nginx.png" },
    { id: "github", name: "GitHub", src: "assets/github.png" },
  ] satisfies TechLogo[],
  osLogos: [
    { id: "windows", name: "Windows", src: "assets/windows.png" },
    { id: "linux", name: "Linux", src: "assets/linux.png" },
    { id: "macos", name: "macOS", src: "assets/macos.png" },
  ] satisfies TechLogo[],
  distroLogos: [
    { id: "ubuntu", name: "Ubuntu", src: "assets/ubuntu.png" },
    { id: "debian", name: "Debian", src: "assets/debian.png" },
    { id: "fedora", name: "Fedora", src: "assets/fedora.png" },
    { id: "linux-mint", name: "Linux Mint", src: "assets/linux-mint.webp" },
    { id: "arch-linux", name: "Arch Linux", src: "assets/arch-linux.png" },
  ] satisfies TechLogo[],
} as const;
