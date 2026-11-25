import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { messageForApiError } from "@/shared/api";
import { privacyAnchorId } from "@/shared/config";
import { content } from "@/shared/content";
import { useI18n, useT } from "@/shared/i18n";
import { Button, Field, SelectInput, TextArea, TextInput } from "@/shared/ui";

import { applicationFormSchema, type ApplicationFormValues } from "../model/schema";
import { useSubmitApplication } from "../model/useSubmitApplication";

import styles from "./ApplicationForm.module.css";

export function ApplicationForm() {
  const t = useT();
  const { lang } = useI18n();
  const mutation = useSubmitApplication();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      name: "",
      contact: "",
      kind: "job",
      message: "",
      privacyConsent: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const parsed = applicationFormSchema.parse(values);
    try {
      await mutation.mutateAsync({
        name: parsed.name,
        contact: parsed.contact,
        kind: parsed.kind,
        message: parsed.message,
      });
      reset({
        name: "",
        contact: "",
        kind: "job",
        message: "",
        privacyConsent: false,
      });
    } catch {
      // status text below
    }
  });

  const statusMessage = mutation.isSuccess
    ? t(content.apply.success)
    : mutation.isError
      ? messageForApiError(lang, mutation.error, "apply")
      : null;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <Field label={t(content.apply.name)} htmlFor="apply-name" error={errors.name?.message}>
        <TextInput
          id="apply-name"
          autoComplete="name"
          hasError={Boolean(errors.name)}
          {...register("name")}
        />
      </Field>
      <Field
        label={t(content.apply.contact)}
        htmlFor="apply-contact"
        error={errors.contact?.message}
      >
        <TextInput
          id="apply-contact"
          autoComplete="email"
          hasError={Boolean(errors.contact)}
          {...register("contact")}
        />
      </Field>
      <Field
        className={styles.full}
        label={t(content.apply.kind)}
        htmlFor="apply-kind"
        error={errors.kind?.message}
      >
        <SelectInput id="apply-kind" hasError={Boolean(errors.kind)} {...register("kind")}>
          <option value="job">{t(content.apply.kindJob)}</option>
          <option value="order">{t(content.apply.kindOrder)}</option>
        </SelectInput>
      </Field>
      <Field
        className={styles.full}
        label={t(content.apply.message)}
        htmlFor="apply-message"
        error={errors.message?.message}
      >
        <TextArea id="apply-message" hasError={Boolean(errors.message)} {...register("message")} />
      </Field>
      <div className={styles.consent}>
        <label htmlFor="apply-privacy">
          <input id="apply-privacy" type="checkbox" {...register("privacyConsent")} />
          <span>
            {t(content.apply.privacyConsent)}{" "}
            <a href={`#${privacyAnchorId}`}>{t(content.apply.privacyLink)}</a>
          </span>
        </label>
        {errors.privacyConsent ? (
          <p className={styles.consentError} role="alert">
            {t(content.apply.privacyConsent)}
          </p>
        ) : null}
      </div>
      <div className={styles.full}>
        <Button type="submit" variant="primary" disabled={isSubmitting || mutation.isPending}>
          {t(content.apply.submit)}
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
