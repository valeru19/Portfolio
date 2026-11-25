import { ModeToggle, useSpiralNavigationContext } from "@/features/section-navigation";
import { LanguageToggle } from "@/features/switch-language";
import { ThemeToggle } from "@/features/switch-theme";
import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import styles from "./Header.module.css";

export function Header() {
  const t = useT();
  const { isAccessible, goTo } = useSpiralNavigationContext();

  return (
    <header className={cn(styles.header, !isAccessible && styles.headerSpiral)}>
      <a
        className={cn(styles.brand, !isAccessible && styles.brandSpiral)}
        href="#hero"
        onClick={(event) => {
          event.preventDefault();
          goTo(0);
        }}
      >
        <span className={styles.monogram} aria-hidden="true">
          {content.meta.monogram}
        </span>
        <span>{t(content.meta.brand)}</span>
      </a>
      <nav className={styles.actions} aria-label="Site">
        <ModeToggle />
        <LanguageToggle />
        <ThemeToggle />
      </nav>
    </header>
  );
}
