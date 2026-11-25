import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { useTheme } from "@/shared/theme";

import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const label = theme === "light" ? t(content.nav.themeDark) : t(content.nav.themeLight);

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={toggleTheme}
      title={label}
      aria-label={label}
    >
      <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
    </button>
  );
}
