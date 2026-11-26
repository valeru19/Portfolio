# `app/providers` — провайдеры контекста

Обёртки React Context / Query, которыми пользуется всё дерево из `App`.

## Файлы

- **`AppProviders.tsx`** — композиция провайдеров (тема, i18n, Query). Используется в `main.tsx` / `App`.
- **`QueryProvider.tsx`** — `QueryClientProvider` для TanStack Query (загрузка отзывов, мутации форм).
- **`index.ts`** — публичный реэкспорт.

## Связи

Тема → [`../../shared/theme`](../../shared/theme/README.md); i18n → [`../../shared/i18n`](../../shared/i18n/README.md); API-хуки entities/features ходят через Query.
