# `shared/lib/test` — окружение тестов

## Файлы

- **`setup.ts`** — подключается из `vite.config.ts` (`test.setupFiles`): jest-dom матчеры, очистка DOM.
- **`index.ts`** — реэкспорт хелперов при необходимости.

Не участвует в прод-бандле, только в Vitest.
