# `app` — приложение

Корневой слой FSD: монтирование React, оболочка лендинга, провайдеры и глобальные стили.

## Файлы

- **`main.tsx`** — `createRoot`, подключает `App` и стили. Точка входа Vite (`index.html` → этот файл).
- **`App.tsx`** — композиция страницы: `Header`, `SpiralStage` / секции-виджеты, футер; оборачивает в навигацию спирали. Тянет виджеты и `features/section-navigation`.
- **`App.module.css`** — стили корневой оболочки (фон/цвет от stage-токенов).
- **`App.test.tsx`** — smoke-тест рендера приложения.
- **`App.apiVisibility.test.tsx`** — проверяет, что формы/отзывы скрыты без `VITE_API_BASE`.
- **`index.ts`** — реэкспорт публичного API слоя `app`.

## Подпапки

- [`providers/`](providers/README.md) — React Query, тема, i18n и т.д.
- [`styles/`](styles/README.md) — reset, токены, global CSS.

## Связи

`main` → `providers` + `App` → `widgets/*` + `features/section-navigation`.
