import { ProjectCard } from "@/entities/project";
import { content, getSectionIndexLabel } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { Container, Section, SectionHead } from "@/shared/ui";

import styles from "./Projects.module.css";

export function Projects() {
  const t = useT();

  return (
    <Section id="projects" aria-labelledby="projects-title">
      <Container>
        <SectionHead
          index={getSectionIndexLabel("projects")}
          titleId="projects-title"
          title={t(content.projects.title)}
        />
        <div className={styles.mosaic}>
          {content.projects.items.map((project, index) => (
            <ProjectCard
              key={typeof project.name === "string" ? project.name : project.name.en}
              project={project}
              indexLabel={String(index + 1).padStart(2, "0")}
              codeLabel={t(content.projects.codeLabel)}
              demoLabel={t(content.projects.demoLabel)}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
