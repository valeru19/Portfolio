import type { LocalizedString } from "@/shared/i18n";

export const reviews = {
  title: { ru: "Отзывы", en: "Reviews" } satisfies LocalizedString,
  /** Shown while the approved list is empty (step 1 answer 5.6). */
  subtitleEmpty: {
    ru: "Отзывы появляются после проверки.",
    en: "Reviews appear after moderation.",
  } satisfies LocalizedString,
  subtitle: {
    ru: "Отзывы клиентов и коллег. Новые появляются после проверки.",
    en: "Feedback from clients and colleagues. New ones appear after moderation.",
  } satisfies LocalizedString,
  empty: {
    ru: "Пока нет опубликованных отзывов — будьте первым.",
    en: "No published reviews yet — be the first.",
  } satisfies LocalizedString,
  formTitle: { ru: "Оставить отзыв", en: "Leave a review" } satisfies LocalizedString,
  name: { ru: "Имя", en: "Name" } satisfies LocalizedString,
  text: { ru: "Текст отзыва", en: "Review text" } satisfies LocalizedString,
  rating: { ru: "Оценка", en: "Rating" } satisfies LocalizedString,
  submit: { ru: "Отправить отзыв", en: "Submit review" } satisfies LocalizedString,
  privacyConsent: {
    ru: "Согласен на обработку моих персональных данных (имя) для публикации отзыва после проверки.",
    en: "I agree to the processing of my personal data (name) to publish the review after moderation.",
  } satisfies LocalizedString,
  privacyLink: {
    ru: "Политика обработки данных",
    en: "Privacy policy",
  } satisfies LocalizedString,
  success: {
    ru: "Спасибо! Отзыв отправлен и появится после проверки.",
    en: "Thanks! Your review was submitted and will appear after moderation.",
  } satisfies LocalizedString,
  error: {
    ru: "Не удалось отправить отзыв. Попробуйте позже.",
    en: "Could not submit the review. Please try again later.",
  } satisfies LocalizedString,
  loading: {
    ru: "Загрузка отзывов…",
    en: "Loading reviews…",
  } satisfies LocalizedString,
  loadError: {
    ru: "Не удалось загрузить отзывы.",
    en: "Could not load reviews.",
  } satisfies LocalizedString,
  tooManyRequests: {
    ru: "Слишком много запросов. Подождите немного и попробуйте снова.",
    en: "Too many requests. Please wait a moment and try again.",
  } satisfies LocalizedString,
} as const;
