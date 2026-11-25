import type { LocalizedString } from "@/shared/i18n";

export const education = {
  title: { ru: "Образование", en: "Education" } satisfies LocalizedString,
  items: [
    {
      degree: {
        ru: "Бакалавриат «Информационные системы и технологии»",
        en: "Bachelor’s in Information Systems and Technologies",
      },
      school: {
        ru: "Пермский национальный исследовательский политехнический университет",
        en: "Perm National Research Polytechnic University",
      },
      dates: { ru: "до 2026", en: "until 2026" },
    },
    {
      degree: {
        ru: "Магистратура «Машинное обучение»",
        en: "Master’s in Machine Learning",
      },
      school: {
        ru: "Пермский национальный исследовательский политехнический университет",
        en: "Perm National Research Polytechnic University",
      },
      dates: { ru: "с 2026", en: "from 2026" },
    },
  ],
} as const;
