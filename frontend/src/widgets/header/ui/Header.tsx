import { useRef } from "react";

import {
  ModeToggle,
  useAccessibleHeaderHide,
  useSpiralNavigationApi,
} from "@/features/section-navigation";
import { LanguageToggle } from "@/features/switch-language";
import { ThemeToggle } from "@/features/switch-theme";
import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import styles from "./Header.module.css";

export function Header() {
  const t = useT();
  const headerRef = useRef<HTMLElement | null>(null);
  const { isAccessible, goTo } = useSpiralNavigationApi();
  const isHeaderHidden = useAccessibleHeaderHide({
    enabled: false,
    headerRef,
  });

  return (
    <header
      ref={headerRef}
      className={cn(
        styles.header,
        isAccessible ? styles.headerAccessible : styles.headerSpiral,
        isAccessible && isHeaderHidden && styles.headerHidden,
      )}
    >
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
      <nav className={styles.actions} aria-label={t(content.a11y.siteNav)}>
        <ModeToggle />
        <LanguageToggle />
        <ThemeToggle />
      </nav>
    </header>
  );
}
