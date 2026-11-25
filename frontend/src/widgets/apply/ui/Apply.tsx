import { ApplicationForm } from "@/features/submit-application";
import { content, getSectionIndexLabel, getVisibleSectionIds } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { Container, Section, SectionHead } from "@/shared/ui";

import styles from "./Apply.module.css";

export function Apply() {
  const t = useT();
  const visibleIds = getVisibleSectionIds();

  return (
    <Section id="apply" aria-labelledby="apply-title">
      <Container>
        <SectionHead
          index={getSectionIndexLabel("apply", visibleIds)}
          titleId="apply-title"
          title={t(content.apply.title)}
        />
        <p className={styles.sub}>{t(content.apply.subtitle)}</p>
        <div className={styles.shell}>
          <ApplicationForm />
        </div>
      </Container>
    </Section>
  );
}
