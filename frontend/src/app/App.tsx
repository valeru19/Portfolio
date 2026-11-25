import { content } from "@/shared/content";
import { useI18n, useT } from "@/shared/i18n";

import { useTheme } from "./providers";

/** Step 3 smoke UI — full sections arrive in step 4. */
export function App() {
  const { lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const projectsStat = content.about.stats.find((s) => s.id === "projects");

  return (
    <main id="main">
      <h1>{t(content.meta.name)}</h1>
      <p>{t(content.meta.role)}</p>
      <p data-testid="project-count">
        {projectsStat ? (
          <>
            {projectsStat.value} {String(t(projectsStat.label))}
          </>
        ) : null}
      </p>
      <div>
        <button type="button" onClick={() => setLang(lang === "ru" ? "en" : "ru")}>
          {t(content.nav.langSwitch)}
        </button>
        <button type="button" onClick={toggleTheme}>
          {theme === "light" ? t(content.nav.themeDark) : t(content.nav.themeLight)}
        </button>
      </div>
      <p data-testid="lang">{lang}</p>
      <p data-testid="theme">{theme}</p>
    </main>
  );
}
