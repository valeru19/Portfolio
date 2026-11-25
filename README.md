# Valeru — лендинг-резюме + заявки и отзывы

React-фронтенд (`frontend/`) и FastAPI-бэкенд (`backend/`).

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

```bash
cd frontend
cp .env.example .env   # Windows: copy .env.example .env
npm ci
npm run dev
```

Откройте URL из вывода Vite (по умолчанию [http://127.0.0.1:3000/Portfolio/](http://127.0.0.1:3000/Portfolio/)).

`base` в Vite — `/Portfolio/` (GitHub Pages). Локально путь тоже с этим префиксом.

## Переменные окружения (frontend)

| Переменная | Назначение |
| --- | --- |
| `VITE_API_BASE` | Базовый URL API (без хвоста). Пусто → формы и отзывы скрыты, сборка проходит. |
| `VITE_SITE_URL` | Канонический origin сайта (для `canonical`, `og:url`, JSON-LD). Пример: `https://valeru19.github.io/Portfolio` |

Шаблоны: `frontend/.env.example`. В GitHub Actions те же имена читаются из **Repository variables** (`vars`), не из secrets.

## Структура

```
Portfolio/
├── frontend/                 # Vite + React + TypeScript (FSD)
│   ├── src/
│   │   ├── app/              # точка входа, провайдеры
│   │   ├── features/         # фичи (формы, спираль, отзывы…)
│   │   ├── widgets/          # крупные блоки страницы
│   │   ├── shared/           # UI, i18n, theme, API-клиент, контент
│   │   └── pages/            # страница лендинга
│   ├── public/               # статика (иконки, логотипы)
│   ├── legacy/               # старый однофайловый лендинг (пока сохранён)
│   ├── vite-plugins/         # SEO-инъекция в dist/index.html
│   └── dist/                 # результат `npm run build`
├── backend/                  # FastAPI + SQLite
├── .github/workflows/        # CI + GitHub Pages
├── DEPLOY.md                 # деплой фронта и бэка
└── README.md
```

## Скрипты frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
```

### esbuild / Vite postinstall

На части машин npm спрашивает разрешение на **postinstall** у `esbuild` (или связанный Vite-скрипт). Бинарник нужен для сборки — **разрешайте** postinstall. Без него `vite` / `vitest` падают с ошибкой отсутствующего бинарника.

Не запускайте `npm audit fix --force`: может прыгнуть мажор и сломать стек.

## Что умеет сайт

- Секции резюме, RU/EN, тёмная/светлая тема, спиральная и accessible-навигация
- Форма **Заявка** → `POST /api/applications` (если задан `VITE_API_BASE`)
- Форма **Отзыв** → `POST /api/reviews`
- Список отзывов → `GET /api/reviews` (только `approved`)

## Модерация (admin)

Ключ: `ADMIN_KEY` из `backend/.env`.

```bash
curl -H "X-Admin-Key: change-me-admin-key" http://127.0.0.1:8000/api/applications
curl -X PATCH -H "X-Admin-Key: change-me-admin-key" http://127.0.0.1:8000/api/reviews/ID/approve
curl -X DELETE -H "X-Admin-Key: change-me-admin-key" http://127.0.0.1:8000/api/reviews/ID
```

## Контент и контакты

Тексты секций — в `frontend/src/shared/content/`.  
Контакты — в `frontend/src/shared/config/contacts.ts` (значения `TODO` / `hidden` не показываются и не попадают в JSON-LD `sameAs`).

## Публикация

См. [DEPLOY.md](./DEPLOY.md). Кратко: фронт — GitHub Pages из `frontend/dist` через Actions; бэкенд — отдельный хост.
