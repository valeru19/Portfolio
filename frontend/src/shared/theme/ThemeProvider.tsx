import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { STORAGE_THEME } from "@/shared/config/storageKeys";
import { safeGetItem, safeSetItem } from "@/shared/lib/safeStorage";

import { ThemeContext, type Theme } from "./themeContext";

function detectTheme(): Theme {
  const fromDom = document.documentElement.getAttribute("data-theme");
  if (fromDom === "dark" || fromDom === "light") return fromDom;

  const stored = safeGetItem(STORAGE_THEME);
  if (stored === "dark" || stored === "light") return stored;

  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f0efed" : "#0c0c0c");
  }
}

type Props = {
  children: ReactNode;
  initialTheme?: Theme;
};

export function ThemeProvider({ children, initialTheme }: Props) {
  const [theme, setThemeState] = useState<Theme>(() => initialTheme ?? detectTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Stable identity so consumers depending on setTheme do not re-render every paint.
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    safeSetItem(STORAGE_THEME, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  // Memoize context value object — same reason as setTheme above.
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
