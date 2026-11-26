/** Путь под `public/` с учётом Vite `base` (`/Portfolio/`). */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = relativePath.replace(/^\//, "");
  return `${base}${clean}`;
}
