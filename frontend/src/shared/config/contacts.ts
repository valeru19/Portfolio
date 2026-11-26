export type ContactLink = {
  id: string;
  label: string;
  value: string;
  href: string;
  copyable?: boolean;
  /** true (или href/value = TODO) — ссылку не рендерим в UI. */
  hidden?: boolean;
};

export const LINKEDIN_PROFILE_SLUG = "валера-кожин-923b8638b";
export const LINKEDIN_PROFILE_DISPLAY = `linkedin.com/in/${LINKEDIN_PROFILE_SLUG}`;

/** Кодирует кириллицу (и прочий non-ASCII) в path для валидного LinkedIn href. */
export function linkedInProfileHref(slug: string = LINKEDIN_PROFILE_SLUG): string {
  return encodeURI(`https://www.linkedin.com/in/${slug}`);
}

/**
 * Реальные контакты живут здесь. Всё ещё `TODO` / `hidden` на страницу не попадает.
 * Телефон сюда не добавлять.
 */
export const contactsConfig = {
  email: {
    id: "email",
    label: "Email",
    value: "wal.era.kozhin01@gmail.com",
    href: "mailto:wal.era.kozhin01@gmail.com",
    copyable: true,
  } satisfies ContactLink,

  telegram: {
    id: "telegram",
    label: "Telegram",
    value: "t.me/comfortable_kitten",
    href: "https://t.me/comfortable_kitten",
  } satisfies ContactLink,

  github: {
    id: "github",
    label: "GitHub",
    value: "github.com/valeru19",
    href: "https://github.com/valeru19",
  } satisfies ContactLink,

  hh: {
    id: "hh",
    label: "hh.ru",
    value: "spb.hh.ru/resume/ee683c75ff10f7d8690039ed1f4b5679303742",
    href: "https://spb.hh.ru/resume/ee683c75ff10f7d8690039ed1f4b5679303742",
  } satisfies ContactLink,

  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    value: LINKEDIN_PROFILE_DISPLAY,
    href: linkedInProfileHref(),
  } satisfies ContactLink,

  vk: {
    id: "vk",
    label: "VK",
    value: "vk.ru/page-777107_28406709",
    href: "https://vk.ru/page-777107_28406709",
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

/** Публичный email для privacy / copy, или null пока TODO. */
export function privacyEmailAddress(): string | null {
  const email = contactsConfig.email;
  return isContactVisible(email) ? email.value : null;
}

/** Приоритет канала: email → Telegram → LinkedIn (privacy / формы). */
export const PRIVACY_CONTACT_PRIORITY = ["email", "telegram", "linkedin"] as const;

export type PrivacyContactId = (typeof PRIVACY_CONTACT_PRIORITY)[number];

/**
 * Первый видимый контакт для запросов «удалить/обновить мои данные».
 * GitHub / hh.ru сюда не берём — это не личные каналы ответа.
 */
export function privacyContactForDeletion(): ContactLink | null {
  for (const id of PRIVACY_CONTACT_PRIORITY) {
    const link = contactsConfig[id];
    if (isContactVisible(link)) return link;
  }
  return null;
}

/** Формы с ПДн требуют канал ответа из приоритетного списка. */
export function hasPrivacyContactChannel(): boolean {
  return privacyContactForDeletion() !== null;
}

/** Только https?-контакты — для JSON-LD sameAs (без mailto:). */
export function sameAsUrls(): string[] {
  return visibleContacts()
    .filter((link) => /^https?:/i.test(link.href))
    .map((link) => link.href);
}

export const privacyAnchorId = "privacy";
