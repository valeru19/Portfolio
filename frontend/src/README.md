# `frontend/src` — исходники React (FSD)

Слои Feature-Sliced Design. Импорты идут «вниз» по слоям: `app` → `widgets` → `features` → `entities` → `shared`.

## Содержимое

| Папка | Роль |
| --- | --- |
| [`app/`](app/README.md) | Точка входа, провайдеры, глобальные стили, корневой `App` |
| [`widgets/`](widgets/README.md) | Крупные блоки страницы (Hero, Stack, Contacts…) |
| [`features/`](features/README.md) | Пользовательские сценарии (спираль, формы, тема, язык) |
| [`entities/`](entities/README.md) | Карточки сущностей (проект, отзыв, tech-лого) |
| [`shared/`](shared/README.md) | API-клиент, контент, i18n, UI-kit, тема |

## Файлы в корне `src`

- **`vite-env.d.ts`** — типы Vite (`import.meta.env`) и ambient-декларации для TS.

Сборка и алиас `@/` → `src/` настраиваются в [`../vite.config.ts`](../vite.config.ts).
