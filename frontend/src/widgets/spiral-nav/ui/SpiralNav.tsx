import { content, getVisibleSectionIds, type SectionId } from "@/shared/content";
import type { LocalizedString } from "@/shared/i18n";
import { useT } from "@/shared/i18n";

import styles from "./SpiralNav.module.css";

const SECTION_ARIA_LABEL: Record<SectionId, LocalizedString> = {
  hero: content.meta.brand,
  about: content.nav.about,
  stack: content.nav.stack,
  experience: content.nav.experience,
  projects: content.nav.projects,
  education: content.nav.education,
  reviews: content.nav.reviews,
  apply: content.nav.apply,
  contacts: content.nav.contacts,
};

/** Anchor-only nav chrome (no wheel/GSAP — step 6). Hides reviews/apply when API is off. */
export function SpiralNav() {
  const t = useT();
  const visibleIds = getVisibleSectionIds();
  const total = String(visibleIds.length).padStart(2, "0");

  return (
    <>
      <nav className={styles.dots} aria-label={t(content.a11y.sectionsNav)}>
        {visibleIds.map((id) => (
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
