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

  // TODO: replace with real email when provided — privacy email line stays hidden until then
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

/** Public email address for privacy text, or null while still TODO. */
export function privacyEmailAddress(): string | null {
  const email = contactsConfig.email;
  return isContactVisible(email) ? email.value : null;
}

/** Prefer email, then Telegram, then LinkedIn for privacy / form contact channel. */
export const PRIVACY_CONTACT_PRIORITY = ["email", "telegram", "linkedin"] as const;

export type PrivacyContactId = (typeof PRIVACY_CONTACT_PRIORITY)[number];

/**
 * First visible contact suitable for “delete/update my data” requests.
 * GitHub / hh.ru are not used here — they are not personal reply channels.
 */
export function privacyContactForDeletion(): ContactLink | null {
  for (const id of PRIVACY_CONTACT_PRIORITY) {
    const link = contactsConfig[id];
    if (isContactVisible(link)) return link;
  }
  return null;
}

/** Forms that collect personal data require a reply channel from the priority list. */
export function hasPrivacyContactChannel(): boolean {
  return privacyContactForDeletion() !== null;
}

export const privacyAnchorId = "privacy";
