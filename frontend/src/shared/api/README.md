# `shared/api` — клиент бэкенда

Обёртка над `fetch` и типизированные вызовы FastAPI. Базовый URL — `VITE_API_BASE` из [`../config`](../config/README.md).

## Файлы

- **`http.ts`** — низкоуровневый запрос, разбор ошибок, заголовки.
- **`types.ts`** — общие DTO (заявка, отзыв и т.п.).
- **`applications.ts`** — POST заявки. Использует `http` + `types`. Фича `submit-application`.
- **`reviews.ts`** — GET одобренных / POST отзыва. Фичи `submit-review`, entity `review`.
- **`errorMessage.ts`** — человекочитаемое сообщение из ответа API для UI форм.
- **`index.ts`** — баррель-экспорт.

Без `VITE_API_BASE` виджеты форм/отзывов скрываются на уровне `App`.
