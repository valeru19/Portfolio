# `backend/app` — приложение FastAPI

Ядро API портфолио: HTTP-роуты, модели БД, схемы валидации, лимиты и конфиг. Точка входа для uvicorn: `app.main:app`.

## Файлы

- **`__init__.py`** — помечает каталог как Python-пакет `app`.
- **`main.py`** — создаёт FastAPI-приложение, CORS, lifespan (инициализация БД), роуты `/api/health`, заявки, отзывы (публичные и админские). Связан с `config`, `database`, `models`, `schemas`, `rate_limit`.
- **`config.py`** — настройки из окружения / `.env` (`ADMIN_KEY`, `CORS_ORIGINS`, путь к SQLite и т.д.). Импортируется всеми модулями `app`.
- **`database.py`** — движок SQLAlchemy, сессии, `init_db`. Используется `main` и тестами через фикстуры.
- **`models.py`** — ORM-таблицы (заявки, отзывы). Используются в роутах `main` и миграциях/создании схемы через `database`.
- **`schemas.py`** — Pydantic-схемы запросов/ответов. Связка между HTTP и `models`.
- **`rate_limit.py`** — простой rate-limit по IP для POST. Подключается в `main` к эндпоинтам форм.

## Связи

```
main.py → config, database, models, schemas, rate_limit
tests/* → main / rate_limit через TestClient и conftest
```

См. также: [`../README.md`](../README.md), [`../tests/README.md`](../tests/README.md).
