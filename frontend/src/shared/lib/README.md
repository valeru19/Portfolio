# `shared/lib` — утилиты

Мелкие чистые функции без UI.

## Файлы

- **`cn.ts`** — склейка className (условные классы для CSS Modules).
- **`assetUrl.ts`** — URL к `public/assets` с учётом Vite `base` (`/Portfolio/`).
- **`copyText.ts`** (+ **`.test.ts`**) — копирование в буфер; основа фичи `copy-email`.
- **`safeStorage.ts`** (+ **`.test.ts`**) — безопасный `localStorage` (private mode / SSR-guard).
- **`localize.ts`** — выбор строки по локали из `{ ru, en }`.
- **`index.ts`** — реэкспорт.
- [`test/`](test/README.md) — setup Vitest.
