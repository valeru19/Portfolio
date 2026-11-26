export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
}

export function getSiteUrl(): string {
  return (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");
}

/** Формы и список отзывов требуют настроенный API base. */
export function isApiConfigured(): boolean {
  return getApiBase().length > 0;
}
