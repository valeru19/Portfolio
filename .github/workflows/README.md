# `.github/workflows` — CI/CD

GitHub Actions для фронтенда и публикации.

## Файлы

- **`frontend.yml`** — пайплайн: установка зависимостей `frontend/`, lint/typecheck/test/build, деплой на GitHub Pages. Читает Repository variables `VITE_SITE_URL`, `VITE_API_BASE` (не secrets). Связан с `frontend/vite.config.ts` (`base: /Portfolio/`) и корневым `DEPLOY.md`.

Подробнее про выкладку: [`../../DEPLOY.md`](../../DEPLOY.md), [`../../frontend/README.md`](../../frontend/README.md).
