import type { LocalizedString, LocalizedStringList } from "@/shared/i18n";
import { useT } from "@/shared/i18n";

import styles from "./TimelineItem.module.css";

type Props = {
  role: LocalizedString;
  company: LocalizedString;
  dates: LocalizedString;
  points: LocalizedStringList;
};

export function TimelineItem({ role, company, dates, points }: Props) {
  const t = useT();
  const pointList = t(points);

  return (
    <li className={styles.item}>
      <h3 className={styles.role}>{t(role)}</h3>
      <p className={styles.company}>{t(company)}</p>
      <p className={styles.dates}>{t(dates)}</p>
      <ul className={styles.points}>
        {pointList.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </li>
  );
}
