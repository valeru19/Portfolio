import type { LocalizedString } from "@/shared/i18n";

export const apply = {
  title: { ru: "Заявка", en: "Application" } satisfies LocalizedString,
  subtitle: {
    ru: "Оставьте заявку на вакансию или заказ разработки — отвечу лично.",
    en: "Leave a request about a role or a development order — I’ll reply personally.",
  } satisfies LocalizedString,
  name: { ru: "Имя", en: "Name" } satisfies LocalizedString,
  contact: { ru: "Email или Telegram", en: "Email or Telegram" } satisfies LocalizedString,
  kind: { ru: "Тип заявки", en: "Request type" } satisfies LocalizedString,
  kindJob: { ru: "Вакансия / работа", en: "Job opportunity" } satisfies LocalizedString,
  kindOrder: { ru: "Заказ разработки", en: "Development order" } satisfies LocalizedString,
  message: { ru: "Сообщение", en: "Message" } satisfies LocalizedString,
  submit: { ru: "Отправить заявку", en: "Send application" } satisfies LocalizedString,
  privacyConsent: {
    ru: "Согласен на обработку моих персональных данных (имя и контакт) для ответа на заявку.",
    en: "I agree to the processing of my personal data (name and contact) to reply to my application.",
  } satisfies LocalizedString,
  privacyLink: {
    ru: "Политика обработки данных",
    en: "Privacy policy",
  } satisfies LocalizedString,
  success: {
    ru: "Заявка отправлена. Свяжусь с вами в ближайшее время.",
    en: "Application sent. I’ll get back to you soon.",
  } satisfies LocalizedString,
  error: {
    ru: "Не удалось отправить заявку. Попробуйте позже.",
    en: "Could not send the application. Please try again later.",
  } satisfies LocalizedString,
  tooManyRequests: {
    ru: "Слишком много запросов. Подождите немного и попробуйте снова.",
    en: "Too many requests. Please wait a moment and try again.",
  } satisfies LocalizedString,
} as const;
