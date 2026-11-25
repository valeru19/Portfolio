import { TechLogo, TechTag } from "@/entities/tech";
import { content, getSectionIndexLabel } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { Container, Section, SectionHead } from "@/shared/ui";

import styles from "./Stack.module.css";

const STRIP_LOGO_IDS = [
  "python",
  "java",
  "csharp",
  "fastapi",
  "sqlalchemy",
  "celery",
  "maven",
  "html5",
  "javascript",
  "typescript",
  "react",
  "angular",
  "postgresql",
  "redis",
  "docker",
  "nginx",
  "github",
] as const;

export function Stack() {
  const t = useT();
  const logosById = new Map(content.experience.techLogos.map((logo) => [logo.id, logo]));
  const stripLogos = STRIP_LOGO_IDS.map((id) => logosById.get(id)).filter(
    (logo): logo is (typeof content.experience.techLogos)[number] => Boolean(logo),
  );

  return (
    <Section id="stack" aria-labelledby="stack-title">
      <Container>
        <SectionHead
          index={getSectionIndexLabel("stack")}
          titleId="stack-title"
          title={t(content.stack.title)}
        />
        <div className={styles.strip}>
          {stripLogos.map((logo) => (
            <TechLogo key={logo.id} id={logo.id} name={logo.name} src={logo.src} compact />
          ))}
        </div>
        <div className={styles.groups}>
          {content.stack.groups.map((group) => (
            <div key={t(group.name)} className={styles.group}>
              <h3>{t(group.name)}</h3>
              <div className={styles.tags}>
                {group.items.map((item) => {
                  const logo = item.logo ? logosById.get(item.logo) : undefined;
                  return (
                    <TechTag
                      key={item.label}
                      label={item.label}
                      logoId={item.logo}
                      logoSrc={logo?.src}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
