# `frontend/vite-plugins` — плагины Vite

## Файлы

- **`htmlSeo.ts`** — на этапе `transformIndexHtml` / build вставляет canonical, Open Graph, JSON-LD, meta description из `VITE_SITE_URL` и контента. Подключён в `vite.config.ts`.
- **`htmlSeo.test.ts`** — юнит-тесты инъекции тегов.

Связан с `shared/content/meta` (косвенно через env/контент при сборке) и деплоем GitHub Pages.
