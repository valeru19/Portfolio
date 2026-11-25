import { content, SECTION_INDEX_LABELS } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { Container, Section, SectionHead } from "@/shared/ui";

import styles from "./Education.module.css";

export function Education() {
  const t = useT();

  return (
    <Section id="education" aria-labelledby="education-title">
      <Container>
        <SectionHead
          index={SECTION_INDEX_LABELS.education}
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
    </Section>
  );
}
