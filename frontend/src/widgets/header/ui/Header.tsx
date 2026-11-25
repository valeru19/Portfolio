import { LanguageToggle } from "@/features/switch-language";
import { ThemeToggle } from "@/features/switch-theme";
import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";

import styles from "./Header.module.css";

export function Header() {
  const t = useT();

  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#hero">
        <span className={styles.monogram} aria-hidden="true">
          {content.meta.monogram}
        </span>
        <span>{t(content.meta.brand)}</span>
      </a>
      <nav className={styles.actions} aria-label="Site">
        <LanguageToggle />
        <ThemeToggle />
      </nav>
    </header>
  );
}
