/** Resolve a path under `public/` with Vite `base` (`/Portfolio/`). */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = relativePath.replace(/^\//, "");
  return `${base}${clean}`;
}
