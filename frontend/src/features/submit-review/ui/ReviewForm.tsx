import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { messageForApiError } from "@/shared/api";
import { privacyAnchorId } from "@/shared/config";
import { content } from "@/shared/content";
import { useI18n, useT } from "@/shared/i18n";
import { Button, Field, SelectInput, TextArea, TextInput } from "@/shared/ui";

import { reviewFormSchema, type ReviewFormValues } from "../model/schema";
import { useSubmitReview } from "../model/useSubmitReview";

import styles from "./ReviewForm.module.css";

export function ReviewForm() {
  const t = useT();
  const { lang } = useI18n();
  const mutation = useSubmitReview();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      name: "",
      text: "",
      rating: 5,
      privacyConsent: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = reviewFormSchema.parse(values);
    try {
      await mutation.mutateAsync({
        name: parsed.name,
        text: parsed.text,
        rating: parsed.rating,
      });
      reset({ name: "", text: "", rating: 5, privacyConsent: false });
    } catch {
      // статус ниже
    }
  });

  const statusMessage = mutation.isSuccess
    ? t(content.reviews.success)
    : mutation.isError
      ? messageForApiError(lang, mutation.error, "review")
      : null;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <Field label={t(content.reviews.name)} htmlFor="review-name" error={errors.name?.message}>
        <TextInput
          id="review-name"
          autoComplete="name"
          hasError={Boolean(errors.name)}
          {...register("name")}
        />
      </Field>
      <Field
        label={t(content.reviews.rating)}
        htmlFor="review-rating"
        error={errors.rating?.message}
      >
        <SelectInput id="review-rating" hasError={Boolean(errors.rating)} {...register("rating")}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field
        className={styles.full}
        label={t(content.reviews.text)}
        htmlFor="review-text"
        error={errors.text?.message}
      >
        <TextArea id="review-text" hasError={Boolean(errors.text)} {...register("text")} />
      </Field>
      <div className={styles.consent}>
        <label htmlFor="review-privacy">
          <input id="review-privacy" type="checkbox" {...register("privacyConsent")} />
          <span>
            {t(content.reviews.privacyConsent)}{" "}
            <a href={`#${privacyAnchorId}`}>{t(content.reviews.privacyLink)}</a>
          </span>
        </label>
        {errors.privacyConsent ? (
          <p className={styles.consentError} role="alert">
            {t(content.reviews.privacyConsent)}
          </p>
        ) : null}
      </div>
      <div className={styles.full}>
        <Button type="submit" variant="primary" disabled={isSubmitting || mutation.isPending}>
          {t(content.reviews.submit)}
        </Button>
        {statusMessage ? (
          <p
            className={mutation.isSuccess ? styles.ok : styles.err}
            role="status"
            aria-live="polite"
          >
            {statusMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
