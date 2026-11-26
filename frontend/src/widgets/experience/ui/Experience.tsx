import { TimelineItem } from "@/entities/experience";
import { TechLogo } from "@/entities/tech";
import { content, getSectionIndexLabel } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { NavSection } from "@/features/section-navigation";
import { Container, SectionHead } from "@/shared/ui";

import styles from "./Experience.module.css";

export function Experience() {
  const t = useT();

  return (
    <NavSection id="experience" aria-labelledby="experience-title">
      <Container>
        <SectionHead
          index={getSectionIndexLabel("experience")}
          titleId="experience-title"
          title={t(content.experience.title)}
        />
        <ol className={styles.timeline}>
          {content.experience.items.map((item) => (
            <TimelineItem
              key={`${t(item.company)}-${t(item.dates)}`}
              role={item.role}
              company={item.company}
              dates={item.dates}
              points={item.points}
            />
          ))}
        </ol>
        <div className={styles.logosBlock}>
          <h3 className={styles.logosTitle}>{t(content.experience.techTitle)}</h3>
          <div className={styles.logoGrid}>
            {content.experience.techLogos.map((logo) => (
              <TechLogo key={logo.id} id={logo.id} name={logo.name} src={logo.src} />
            ))}
          </div>
          <h3 className={styles.logosTitle}>{t(content.experience.osTitle)}</h3>
          <div className={styles.osGrid}>
            {content.experience.osLogos.map((logo) => (
              <TechLogo key={logo.id} id={logo.id} name={logo.name} src={logo.src} compact />
            ))}
          </div>
          <h3 className={styles.logosTitle}>{t(content.experience.distroTitle)}</h3>
          <div className={styles.distroGrid}>
            {content.experience.distroLogos.map((logo) => (
              <TechLogo key={logo.id} id={logo.id} name={logo.name} src={logo.src} compact />
            ))}
          </div>
        </div>
      </Container>
    </NavSection>
  );
}
