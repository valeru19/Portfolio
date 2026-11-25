import {
  content,
  STATIC_SECTION_IDS,
  type StaticSectionId,
} from "@/shared/content";
import type { LocalizedString } from "@/shared/i18n";
import { useT } from "@/shared/i18n";

import styles from "./SpiralNav.module.css";

const SECTION_ARIA_LABEL: Record<StaticSectionId, LocalizedString> = {
  hero: content.meta.brand,
  about: content.nav.about,
  stack: content.nav.stack,
  experience: content.nav.experience,
  projects: content.nav.projects,
  education: content.nav.education,
  contacts: content.nav.contacts,
};

/** Anchor-only nav chrome for step 4 (no wheel/GSAP — that is step 6). */
export function SpiralNav() {
  const t = useT();
  const total = String(STATIC_SECTION_IDS.length).padStart(2, "0");

  return (
    <>
      <nav className={styles.dots} aria-label="Sections">
        {STATIC_SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className={styles.dot}
            aria-label={t(SECTION_ARIA_LABEL[id])}
          />
        ))}
      </nav>
      <p className={styles.counter} aria-live="polite">
        <span>01</span> <span>{t(content.spiral.of)}</span> <span>{total}</span>
      </p>
    </>
  );
}
