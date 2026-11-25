import { content, type SectionId } from "@/shared/content";
import type { LocalizedString } from "@/shared/i18n";
import { useT } from "@/shared/i18n";

import { useSpiralNavigationContext } from "../hooks/useSpiralNavigationContext";
import { formatSectionCounter } from "../model/sectionIndex";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import styles from "./SpiralHud.module.css";

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

export function SpiralHud() {
  const t = useT();
  const { sectionIds, currentIndex, isAccessible, goTo, goNext } = useSpiralNavigationContext();

  if (isAccessible) return null;

  const { current, total } = formatSectionCounter(currentIndex, sectionIds.length);

  return (
    <>
      <nav
        className={styles.dots}
        aria-label={t(content.a11y.sectionsNav)}
        {...{ [SPIRAL_DOM_ATTR.hud]: "" }}
      >
        {sectionIds.map((id, index) => (
          <button
            key={id}
            type="button"
            className={index === currentIndex ? styles.dotActive : styles.dot}
            aria-label={t(SECTION_ARIA_LABEL[id])}
            aria-current={index === currentIndex ? "true" : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </nav>
      <p className={styles.counter} aria-live="polite" {...{ [SPIRAL_DOM_ATTR.hud]: "" }}>
        <span>{current}</span> <span>{t(content.spiral.of)}</span> <span>{total}</span>
      </p>
      <div className={styles.controls} {...{ [SPIRAL_DOM_ATTR.hud]: "" }}>
        <button type="button" className={styles.next} onClick={goNext}>
          <span className={styles.phi} aria-hidden="true" />
          <span>{t(content.spiral.scroll)}</span>
        </button>
      </div>
    </>
  );
}
