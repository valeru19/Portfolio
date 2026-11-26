# `backend/tests` — тесты API

Pytest-набор для FastAPI. Запуск из `backend/`: `pytest -q` (нужен `requirements-dev.txt`).

## Файлы

- **`__init__.py`** — пакет тестов.
- **`conftest.py`** — общие фикстуры: тестовое приложение, клиент, изоляция БД. Подменяет конфиг/БД, чтобы не трогать `data/portfolio.db`.
- **`test_api.py`** — сценарии health, создание заявок/отзывов, админские операции с `X-Admin-Key`. Бьёт в роуты из `app.main`.
- **`test_rate_limit.py`** — проверяет ограничение частоты запросов из `app.rate_limit`.

## Связи

Тесты зависят от пакета [`../app`](../app/README.md). Конфиг pytest — [`../pytest.ini`](../pytest.ini).
