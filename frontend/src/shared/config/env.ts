export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
}

export function getSiteUrl(): string {
  return (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");
}

/** Forms and review list require a configured API base. */
export function isApiConfigured(): boolean {
  return getApiBase().length > 0;
}
