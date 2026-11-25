import { ReviewCard, useApprovedReviews } from "@/entities/review";
import { ReviewForm } from "@/features/submit-review";
import { messageForApiError } from "@/shared/api";
import { content, getSectionIndexLabel, getVisibleSectionIds } from "@/shared/content";
import { useI18n, useT } from "@/shared/i18n";
import { NavSection } from "@/features/section-navigation";
import { Container, SectionHead } from "@/shared/ui";

import styles from "./Reviews.module.css";

export function Reviews() {
  const t = useT();
  const { lang } = useI18n();
  const visibleIds = getVisibleSectionIds();
  const { data, isLoading, isError, error } = useApprovedReviews();
  const reviews = data ?? [];
  const isEmpty = !isLoading && !isError && reviews.length === 0;

  return (
    <NavSection id="reviews" aria-labelledby="reviews-title">
      <Container>
        <SectionHead
          index={getSectionIndexLabel("reviews", visibleIds)}
          titleId="reviews-title"
          title={t(content.reviews.title)}
        />
        <p className={styles.sub}>
          {isEmpty ? t(content.reviews.subtitleEmpty) : t(content.reviews.subtitle)}
        </p>
        <div className={styles.layout}>
          <div className={styles.list} aria-live="polite">
            {isLoading ? (
              <p className={styles.hint} aria-busy="true">
                {t(content.reviews.loading)}
              </p>
            ) : null}
            {isError ? (
              <p className={styles.hint} role="alert">
                {messageForApiError(lang, error, "loadReviews")}
              </p>
            ) : null}
            {isEmpty ? <p className={styles.hint}>{t(content.reviews.empty)}</p> : null}
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>{t(content.reviews.formTitle)}</h3>
            <ReviewForm />
          </div>
        </div>
      </Container>
    </NavSection>
  );
}
