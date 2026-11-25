# Valeru — лендинг-резюме + заявки и отзывы

Фронтенд: статический `frontend/index.html`  
Бэкенд: FastAPI + SQLite в `backend/`

## Быстрый старт

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # или: cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

Документация API: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend

В другом терминале из корня проекта:

```bash
npx --yes serve frontend -p 3000
```

Откройте [http://127.0.0.1:3000](http://127.0.0.1:3000).

Базовый URL API задаётся в `CONTENT.apiBase` внутри `frontend/index.html` (по умолчанию `http://127.0.0.1:8000`).

Если порт фронта другой — добавьте origin в `backend/.env` → `CORS_ORIGINS`.

## Что умеет сайт

- Секции резюме, RU/EN, тёмная/светлая тема
- Форма **Заявка** → `POST /api/applications`
- Форма **Отзыв** → `POST /api/reviews` (статус `pending`)
- Список отзывов → `GET /api/reviews` (только `approved`)

## Модерация (admin)

Ключ: `ADMIN_KEY` из `backend/.env` (по умолчанию `change-me-admin-key`).

Список заявок:

```bash
curl -H "X-Admin-Key: change-me-admin-key" http://127.0.0.1:8000/api/applications
```

Одобрить отзыв (подставьте `ID`):

```bash
curl -X PATCH -H "X-Admin-Key: change-me-admin-key" http://127.0.0.1:8000/api/reviews/ID/approve
```

Удалить отзыв:

```bash
curl -X DELETE -H "X-Admin-Key: change-me-admin-key" http://127.0.0.1:8000/api/reviews/ID
```

## Контент сайта

Тексты, контакты и `apiBase` правятся только в объекте `CONTENT` в `frontend/index.html`.

## Публикация

- **Frontend** — GitHub Pages / Cloudflare Pages из папки `frontend/`
- **Backend** — отдельный хост (VPS, Railway, Render и т.п.); после деплоя обновите `CONTENT.apiBase` и `CORS_ORIGINS`

Подробнее про статический хостинг: [DEPLOY.md](DEPLOY.md)
