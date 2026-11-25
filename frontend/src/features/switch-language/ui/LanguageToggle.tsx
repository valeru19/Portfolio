import { content } from "@/shared/content";
import { useI18n, useT } from "@/shared/i18n";

import styles from "./LanguageToggle.module.css";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const t = useT();
  const nextLang = lang === "ru" ? "en" : "ru";
  const label = lang === "ru" ? "EN" : "RU";

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={() => setLang(nextLang)}
      title={t(content.nav.langSwitch)}
      aria-label={t(content.nav.langSwitch)}
    >
      {label}
    </button>
  );
}
