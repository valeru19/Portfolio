import type { ProjectItem } from "@/shared/content";
import { useI18n, useT } from "@/shared/i18n";
import { localizeName } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { hasProjectLink } from "./hasProjectLink";
import styles from "./ProjectCard.module.css";

type Props = {
  project: ProjectItem;
  indexLabel: string;
  codeLabel: string;
  demoLabel: string;
};

export function ProjectCard({ project, indexLabel, codeLabel, demoLabel }: Props) {
  const t = useT();
  const { lang } = useI18n();
  const name = localizeName(lang, project.name);
  const points = t(project.points);
  const showCode = hasProjectLink(project.code);
  const showDemo = hasProjectLink(project.demo);

  return (
    <article className={styles.card} data-detail={project.detail} data-index={indexLabel}>
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.summary}>{t(project.summary)}</p>
      <ul className={styles.points}>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      {showCode || showDemo ? (
        <div className={styles.actions}>
          {showCode ? (
            <Button href={project.code} variant="ghost">
              {codeLabel}
            </Button>
          ) : null}
          {showDemo ? (
            <Button href={project.demo} variant="primary">
              {demoLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
