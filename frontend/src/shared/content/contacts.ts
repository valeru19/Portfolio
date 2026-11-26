import { visibleContacts } from "@/shared/config/contacts";
import type { LocalizedString } from "@/shared/i18n";

export const contacts = {
  title: { ru: "Контакты", en: "Contacts" } satisfies LocalizedString,
  subtitle: {
    ru: "Напишите — отвечу по работе, проектам и сотрудничеству.",
    en: "Write me about roles, projects and collaboration.",
  } satisfies LocalizedString,
  copy: { ru: "Скопировать email", en: "Copy email" } satisfies LocalizedString,
  copied: { ru: "Скопировано", en: "Copied" } satisfies LocalizedString,
  /** Только не-TODO ссылки из shared/config/contacts. */
  links: visibleContacts(),
};
