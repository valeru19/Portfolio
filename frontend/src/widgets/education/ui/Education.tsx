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
          {content.education.items.map((item) => (
            <article key={t(item.degree)} className={styles.item}>
              <h3 className={styles.degree}>{t(item.degree)}</h3>
              <p className={styles.school}>{t(item.school)}</p>
              <p className={styles.dates}>{t(item.dates)}</p>
            </article>
          ))}
        </div>
      </Container>
    </NavSection>
  );
}
