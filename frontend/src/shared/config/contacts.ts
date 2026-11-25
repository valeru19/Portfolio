import type { LocalizedString } from "@/shared/i18n";

export type ContactLink = {
  id: string;
  label: string;
  value: string;
  href: string;
  copyable?: boolean;
  /** When true (or href/value is TODO), the link must not render in UI. */
  hidden?: boolean;
};

/**
 * Real contact values live here. Anything still `TODO` stays hidden on the page.
 * Known: GitHub = https://github.com/valeru19
 */
export const contactsConfig = {
  github: {
    id: "github",
    label: "GitHub",
    value: "github.com/valeru19",
    href: "https://github.com/valeru19",
  } satisfies ContactLink,

  // TODO: replace with real email when provided
  email: {
    id: "email",
    label: "Email",
    value: "TODO",
    href: "TODO",
    copyable: true,
    hidden: true,
  } satisfies ContactLink,

  // TODO: replace with real Telegram when provided
  telegram: {
    id: "telegram",
    label: "Telegram",
    value: "TODO",
    href: "TODO",
    hidden: true,
  } satisfies ContactLink,

  // TODO: replace with real LinkedIn when provided
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    value: "TODO",
    href: "TODO",
    hidden: true,
  } satisfies ContactLink,

  // TODO: replace with real hh.ru resume URL when provided
  hh: {
    id: "hh",
    label: "hh.ru",
    value: "TODO",
    href: "TODO",
    hidden: true,
  } satisfies ContactLink,
} as const;

export function isContactVisible(link: ContactLink): boolean {
  if (link.hidden) return false;
  if (!link.href || link.href === "TODO") return false;
  if (!link.value || link.value === "TODO") return false;
  return true;
}

export function visibleContacts(): ContactLink[] {
  return Object.values(contactsConfig).filter(isContactVisible);
}

export function hhResumeHref(): string | null {
  const hh = contactsConfig.hh;
  return isContactVisible(hh) ? hh.href : null;
}

export const privacyAnchorId = "privacy";

export const privacyTodoNote: LocalizedString = {
  ru: "TODO: текст политики обработки персональных данных будет добавлен отдельно.",
  en: "TODO: privacy policy text will be provided separately.",
};
