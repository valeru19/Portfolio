import styles from "./SectionHead.module.css";

type Props = {
  index: string;
  titleId: string;
  title: string;
};

export function SectionHead({ index, titleId, title }: Props) {
  return (
    <div className={styles.head}>
      <span className={styles.index} aria-hidden="true">
        {index}
      </span>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
    </div>
  );
}
