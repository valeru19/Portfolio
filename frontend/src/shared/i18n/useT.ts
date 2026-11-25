import type { Lang, Localizable, LocalizedString, LocalizedStringList } from "./types";
import { useI18n } from "./useI18n";

function pick(lang: Lang, value: Localizable): string | string[] {
  if (typeof value === "string") return value;
  return value[lang];
}

export type TranslateFn = {
  (value: LocalizedString): string;
  (value: LocalizedStringList): string[];
  (value: string): string;
  (value: Localizable): string | string[];
};

export function useT(): TranslateFn {
  const { lang } = useI18n();

  const translateFn = ((value: Localizable) => pick(lang, value)) as TranslateFn;
  return translateFn;
}

export function translate(lang: Lang, value: LocalizedString): string;
export function translate(lang: Lang, value: LocalizedStringList): string[];
export function translate(lang: Lang, value: string): string;
export function translate(lang: Lang, value: Localizable): string | string[] {
  return pick(lang, value);
}
