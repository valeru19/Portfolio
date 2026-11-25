# Публикация

Сайт разделён на `frontend/` (статика после Vite build) и `backend/` (API). GitHub Pages обслуживает только фронт; для заявок и отзывов нужен запущенный backend и непустой `VITE_API_BASE`.

## Frontend — GitHub Pages (рекомендуемый путь)

Workflow: `.github/workflows/frontend.yml`

1. В репозитории: **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables** задайте:
   - `VITE_SITE_URL` — например `https://<user>.github.io/Portfolio` (без завершающего `/` или с ним — плагин нормализует).
   - `VITE_API_BASE` — URL бэкенда **или оставьте пустым** (формы скрыты, сборка всё равно проходит).
3. Push в `main` запускает: `lint` → `typecheck` → `test` → `build` → публикация `frontend/dist`.
4. В `vite.config.ts` задано `base: "/Portfolio/"` — имя репозитория должно совпадать, либо поменяйте `base`.

Локальная проверка артефакта:

```bash
cd frontend
# VITE_SITE_URL и VITE_API_BASE можно задать в .env
npm run build
npm run preview
```

В собранном `dist/index.html` уже лежат meta / Open Graph / canonical / JSON-LD Person (без выполнения клиентского JS).  
`og:image` появляется **только** если в `frontend/public/` есть `og-image.png|jpg|webp`.

### esbuild

При `npm ci` на CI и локально нужен postinstall `esbuild`. Если package manager блокирует скрипты — разрешите их для этого репозитория, иначе сборка упадёт.

## Frontend — Cloudflare Pages (альтернатива)

1. Connect to Git → репозиторий.
2. Root: `frontend`, build: `npm ci && npm run build`, output: `dist`.
3. Env vars: `VITE_API_BASE`, `VITE_SITE_URL`.
4. Учтите `base: "/Portfolio/"` — для корня домена смените `base` на `/`.

## Backend

1. Задеплойте `backend/` на VPS / Railway / Render / аналог.
2. Задайте:
   - `ADMIN_KEY`
   - `CORS_ORIGINS` — origin фронта (например `https://valeru19.github.io`)
   - при необходимости `DATABASE_URL`
3. Старт: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Пропишите тот же публичный URL API в `VITE_API_BASE` (variable репозитория) и пересоберите фронт.

## Свой домен

DNS у хостера фронта и/или бэка. Обновите `VITE_SITE_URL`, `CORS_ORIGINS` и при смене API — `VITE_API_BASE`.

## Lighthouse (mobile) локально

Цель: ≥ 90 по Performance / Accessibility / Best Practices / SEO.

1. `cd frontend && npm run build && npm run preview`
2. Chrome → DevTools → Lighthouse → Device: **Mobile** → Analyze.
3. Или CLI:

```bash
npx --yes lighthouse http://127.0.0.1:4173/Portfolio/ --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=./lighthouse-report.html
```

(порт `preview` смотрите в выводе Vite; путь `/Portfolio/` обязателен из‑за `base`.)
