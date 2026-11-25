import type { Lang, LocalizedString } from "@/shared/i18n";

export function localizeName(lang: Lang, name: string | LocalizedString): string {
  return typeof name === "string" ? name : name[lang];
}
