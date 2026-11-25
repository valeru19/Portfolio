# Публикация

Сайт разделён на `frontend/` (статика) и `backend/` (API). GitHub Pages обслуживает только фронт; для заявок и отзывов нужен запущенный backend.

## Frontend (GitHub Pages)

1. Создайте публичный репозиторий.
2. В Settings → Pages укажите ветку и папку `/frontend` (или копируйте содержимое `frontend/` в корень Pages).
3. После деплоя API на `127.0.0.1` недоступен — пропишите прод-URL в `CONTENT.apiBase`.

## Frontend (Cloudflare Pages)

1. Connect to Git → репозиторий.
2. Framework: None, output directory: `frontend`.
3. Обновите `CONTENT.apiBase` на URL бэкенда.

## Backend

1. Задеплойте `backend/` на VPS / Railway / Render.
2. Задайте `ADMIN_KEY`, `CORS_ORIGINS` (origin фронта), при необходимости `DATABASE_URL`.
3. Команда старта: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

## Свой домен

Подключается у хостера фронта и/или бэка через DNS. Код фронта менять не нужно, кроме `apiBase`, если меняется URL API.
