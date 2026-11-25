import type { LocalizedString } from "@/shared/i18n";

export const education = {
  title: { ru: "Образование", en: "Education" } satisfies LocalizedString,
  items: [
    {
      degree: {
        ru: "Бакалавриат — Информационные системы и технологии",
        en: "Bachelor’s — Information Systems and Technologies",
      },
      school: {
        ru: "Пермский национальный исследовательский политехнический университет",
        en: "Perm National Research Polytechnic University",
      },
      dates: { ru: "2022–2026", en: "2022–2026" },
    },
    {
      degree: {
        ru: "Магистратура (в процессе) — Математическая кибернетика",
        en: "Master’s (in progress) — Mathematical Cybernetics",
      },
      school: {
        ru: "Пермский национальный исследовательский политехнический университет",
        en: "Perm National Research Polytechnic University",
      },
      dates: { ru: "с 2026", en: "from 2026" },
    },
    {
      degree: {
        ru: "Дополнительная профессиональная переподготовка — Машинное обучение и компьютерное зрение",
        en: "Professional retraining — Machine Learning and Computer Vision",
      },
      school: {
        ru: "Пермский национальный исследовательский политехнический университет",
        en: "Perm National Research Polytechnic University",
      },
      dates: { ru: "2025–2026", en: "2025–2026" },
    },
  ],
} as const;
