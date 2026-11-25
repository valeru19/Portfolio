import { content, SECTION_INDEX_LABELS } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { Container, Section, SectionHead } from "@/shared/ui";

import styles from "./About.module.css";

export function About() {
  const t = useT();
  const paragraphs = t(content.about.text);

  return (
    <Section id="about" aria-labelledby="about-title">
      <Container>
        <SectionHead
          index={SECTION_INDEX_LABELS.about}
          titleId="about-title"
          title={t(content.about.title)}
        />
        <div className={styles.grid}>
          <div className={styles.text}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className={styles.stats}>
            {content.about.stats.map((stat) => (
              <div key={stat.id} className={styles.stat}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{t(stat.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
