import type { MouseEvent } from "react";

import { NavSection, useSpiralNavigationContext } from "@/features/section-navigation";
import { hhResumeHref } from "@/shared/config";
import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { Button, Container } from "@/shared/ui";

import styles from "./Hero.module.css";

export function Hero() {
  const t = useT();
  const resumeHref = hhResumeHref();
  const { goTo, sectionIds, isAccessible } = useSpiralNavigationContext();

  const onContactClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isAccessible) return;
    event.preventDefault();
    const contactsIndex = sectionIds.indexOf("contacts");
    goTo(contactsIndex < 0 ? sectionIds.length - 1 : contactsIndex);
  };

  return (
    <NavSection id="hero" aria-labelledby="hero-name">
      <Container>
        <p className={styles.kicker}>{t(content.hero.tagline)}</p>
        <div className={styles.badge}>{t(content.meta.status)}</div>
        <h1 id="hero-name" className={styles.name}>
          {t(content.meta.name)}
        </h1>
        <p className={styles.role}>{t(content.meta.role)}</p>
        <p className={styles.sub}>{t(content.hero.subtitle)}</p>
        <div className={styles.actions}>
          <Button href="#contacts" variant="primary" onClick={onContactClick}>
            {t(content.hero.ctaContact)}
          </Button>
          {resumeHref ? (
            <Button href={resumeHref} variant="ghost">
              {t(content.hero.ctaResume)}
            </Button>
          ) : null}
        </div>
        <div className={styles.metaGrid}>
          <div>
            <p className={styles.cellLabel}>{t(content.hero.locationLabel)}</p>
            <p className={styles.cellValue}>{t(content.meta.location)}</p>
          </div>
          <div>
            <p className={styles.cellLabel}>{t(content.hero.workLabel)}</p>
            <p className={styles.cellValue}>{t(content.meta.role)}</p>
          </div>
        </div>
      </Container>
    </NavSection>
  );
}
