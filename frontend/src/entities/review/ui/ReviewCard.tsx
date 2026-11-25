import type { ReviewPublic } from "@/shared/api";

import styles from "./ReviewCard.module.css";

type Props = {
  review: ReviewPublic;
};

export function ReviewCard({ review }: Props) {
  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <h3 className={styles.name}>{review.name}</h3>
        <span className={styles.rating} aria-label={`Rating ${review.rating} of 5`}>
          {review.rating}/5
        </span>
      </div>
      <p className={styles.text}>{review.text}</p>
    </article>
  );
}
