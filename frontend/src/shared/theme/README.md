# `shared/theme` — светлая / тёмная тема

## Файлы

- **`themeContext.ts`** — тип темы и Context.
- **`ThemeProvider.tsx`** — состояние темы, класс на `documentElement`, persistence через `safeStorage` + `storageKeys`.
- **`useTheme.ts`** — хук чтения/переключения.
- **`theme.test.tsx`** — тесты провайдера.
- **`index.ts`** — баррель.

Переключатель UI — [`features/switch-theme`](../../features/switch-theme/README.md). Палитры секций зависят от темы в `sectionPalettes`.
