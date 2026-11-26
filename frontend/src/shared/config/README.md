# `shared/config` — конфигурация фронта

Статические настройки и чтение env/localStorage-ключей.

## Файлы

- **`env.ts`** — `import.meta.env` (`VITE_API_BASE`, `VITE_SITE_URL`), флаги «API доступен».
- **`contacts.ts`** — email, соцссылки, hh/Telegram и т.д. для Contacts/Hero/Footer.
- **`contacts.test.ts`** / **`contacts.privacy.test.ts`** — проверки ссылок и privacy-согласованности.
- **`storageKeys.ts`** — ключи `localStorage` (тема, язык, режим спирали). Используют theme/i18n/section-navigation.
- **`index.ts`** — реэкспорт.

Связь с бэкенд-CORS и деплоем описана в корневом `DEPLOY.md`.
