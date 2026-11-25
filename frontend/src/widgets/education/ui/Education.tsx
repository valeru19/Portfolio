import { content, getSectionIndexLabel } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { NavSection } from "@/features/section-navigation";
import { Container, SectionHead } from "@/shared/ui";

import styles from "./Education.module.css";

export function Education() {
  const t = useT();

  return (
    <NavSection id="education" aria-labelledby="education-title">
      <Container>
        <SectionHead
          index={getSectionIndexLabel("education")}
          titleId="education-title"
          title={t(content.education.title)}
        />
        <div className={styles.list}>
          {content.education.items.map((item) => {
            const school = t(item.school).trim();
            const dates = t(item.dates).trim();
            return (
              <article key={t(item.degree)} className={styles.item}>
                <h3 className={styles.degree}>{t(item.degree)}</h3>
                {school ? <p className={styles.school}>{school}</p> : null}
                {dates ? <p className={styles.dates}>{dates}</p> : null}
              </article>
            );
          })}
        </div>
      </Container>
    </NavSection>
  );
}
