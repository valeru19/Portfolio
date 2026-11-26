# Backend (FastAPI + SQLite)

API заявок и отзывов. Подробные описания модулей — в подпапках:

- [`app/README.md`](app/README.md) — код приложения
- [`tests/README.md`](tests/README.md) — pytest
- [`data/README.md`](data/README.md) — SQLite runtime

## Файлы в корне `backend/`

- **`Dockerfile`** — образ API (non-root `appuser`, том `/app/data`).
- **`requirements.txt`** — прод-зависимости (FastAPI, uvicorn, SQLAlchemy…).
- **`requirements-dev.txt`** — pytest и тестовые зависимости.
- **`pytest.ini`** — настройки pytest.
- **`.env.example`** — шаблон `ADMIN_KEY`, `CORS_ORIGINS`, `DATABASE_URL` (не коммитить реальный `.env`).

## Local (PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Set ADMIN_KEY in .env to a real secret (not change-me-admin-key)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health:

```powershell
curl.exe -s http://127.0.0.1:8000/api/health
```

Create application (JSON in single quotes so PowerShell does not mangle it):

```powershell
curl.exe -s -X POST http://127.0.0.1:8000/api/applications `
  -H "Content-Type: application/json" `
  -d '{"name":"Ivan","contact":"ivan@example.com","kind":"job","message":"Interested in a backend role."}'
```

List applications (admin):

```powershell
curl.exe -s -H "X-Admin-Key: YOUR_ADMIN_KEY" http://127.0.0.1:8000/api/applications
```

Approve a review:

```powershell
curl.exe -s -X PATCH http://127.0.0.1:8000/api/reviews/1/approve `
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

Tests:

```powershell
pip install -r requirements-dev.txt
pytest -q
```

## Docker: SQLite volume

The image runs as non-root user `appuser` (uid `10001`). SQLite lives under `/app/data`. That directory is declared as a `VOLUME` and is writable by `appuser`.

Persist the database across container restarts by bind-mounting a host folder to `/app/data`. On the host, the mounted directory must be writable by uid `10001` (or start with an empty folder that Docker can chown on Linux; on Windows Desktop the mount is typically writable out of the box).

### Build

```powershell
cd backend
docker build -t valeru-portfolio-api .
```

### Run with volume (PowerShell)

```powershell
New-Item -ItemType Directory -Force -Path .\data-docker | Out-Null

docker run --rm -d --name valeru-api -p 8000:8000 `
  -e ADMIN_KEY=your-strong-secret `
  -e CORS_ORIGINS=https://valeru19.github.io `
  -e DATABASE_URL=sqlite:////app/data/portfolio.db `
  -v ${PWD}/data-docker:/app/data `
  valeru-portfolio-api
```

Smoke checks:

```powershell
curl.exe -s http://127.0.0.1:8000/api/health

curl.exe -s -X POST http://127.0.0.1:8000/api/applications `
  -H "Content-Type: application/json" `
  -d '{"name":"Ivan","contact":"ivan@example.com","kind":"job","message":"Interested in a backend role."}'

curl.exe -s -H "X-Admin-Key: your-strong-secret" http://127.0.0.1:8000/api/applications
```

Restart and confirm data remains:

```powershell
docker stop valeru-api
docker run --rm -d --name valeru-api -p 8000:8000 `
  -e ADMIN_KEY=your-strong-secret `
  -e CORS_ORIGINS=https://valeru19.github.io `
  -e DATABASE_URL=sqlite:////app/data/portfolio.db `
  -v ${PWD}/data-docker:/app/data `
  valeru-portfolio-api

curl.exe -s -H "X-Admin-Key: your-strong-secret" http://127.0.0.1:8000/api/applications
```
