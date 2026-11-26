import type { LocalizedString, LocalizedStringList } from "@/shared/i18n";

/**
 * Текст политики privacy. Предложение с email рендерится только если
 * в contactsConfig есть реальный email (не TODO).
 */
export const privacy = {
  title: {
    ru: "Обработка персональных данных",
    en: "Personal data processing",
  } satisfies LocalizedString,
  paragraphs: {
    ru: [
      "Оператор: Кожин Валерий Алексеевич. Через формы на сайте собираются имя, контакт для связи и текст сообщения. Данные нужны только для того, чтобы ответить на заявку или опубликовать отзыв после проверки. Они хранятся на сервере сайта и не передаются третьим лицам. Заявки хранятся до завершения общения, отзывы до удаления по просьбе автора.",
      "Отправляя форму, вы даёте согласие на такую обработку.",
    ],
    en: [
      "Controller: Valeriy Alekseevich Kozhin. Forms on this site collect your name, a contact for replies, and the message text. The data is used only to answer an application or to publish a review after moderation. It is stored on the site server and is not shared with third parties. Applications are kept until the conversation is finished; reviews until the author asks for deletion.",
      "By submitting a form, you consent to this processing.",
    ],
  } satisfies LocalizedStringList,
  /**
   * Строка, когда виден email / Telegram / LinkedIn (по приоритету).
   * Плейсхолдер `{contact}` заменяется значением контакта.
   */
  contactLine: {
    ru: "Чтобы удалить или изменить свои данные, напишите: {contact}.",
    en: "To delete or update your data, write to {contact}.",
  } satisfies LocalizedString,
} as const;
