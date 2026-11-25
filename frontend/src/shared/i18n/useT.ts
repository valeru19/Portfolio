import { useCallback } from "react";

import type { Lang, Localizable, LocalizedString, LocalizedStringList } from "./types";
import { useI18n } from "./useI18n";

function pick(lang: Lang, value: Localizable): string | string[] {
  if (typeof value === "string") return value;
  return value[lang];
}

export function useT() {
  const { lang } = useI18n();

  // Stable t() reference when lang is unchanged (safe to pass into memoized children later).
  return useCallback(
    (value: LocalizedString | LocalizedStringList | string): string | string[] =>
      pick(lang, value),
    [lang],
  );
}

export function translate(lang: Lang, value: LocalizedString): string;
export function translate(lang: Lang, value: LocalizedStringList): string[];
export function translate(lang: Lang, value: string): string;
export function translate(lang: Lang, value: Localizable): string | string[] {
  return pick(lang, value);
}
