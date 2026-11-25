import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { STORAGE_LANG } from "@/shared/config/storageKeys";
import { safeGetItem, safeSetItem } from "@/shared/lib/safeStorage";

import { I18nContext } from "./context";
import type { Lang } from "./types";

function detectLang(): Lang {
  const stored = safeGetItem(STORAGE_LANG);
  if (stored === "ru" || stored === "en") return stored;
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
  }
  return "ru";
}

type Props = {
  children: ReactNode;
  /** Override for tests */
  initialLang?: Lang;
};

export function I18nProvider({ children, initialLang }: Props) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? detectLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Stable identity so consumers depending on setLang do not re-render every paint.
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    safeSetItem(STORAGE_LANG, next);
  }, []);

  // Memoize context value object — same reason as setLang above.
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
