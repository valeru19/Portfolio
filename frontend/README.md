# Frontend (Vite + React + TypeScript)

Лендинг-резюме на FSD. Подробные описания **каждого файла** — в `README.md` внутри соответствующих папок `src/`, `public/`, `vite-plugins/` и т.д.

## Установка

```bash
cd frontend
cp .env.example .env   # Windows: copy .env.example .env
npm ci
```

Используйте `npm ci`, чтобы совпасть с `package-lock.json`. Postinstall у `esbuild`/Vite нужно разрешить — иначе бинарник не соберётся.

## Скрипты

```bash
npm run dev        # http://127.0.0.1:3000/Portfolio/  (base=/Portfolio/)
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
```

Рекомендуемый локальный запуск: `npm run dev -- --host 127.0.0.1 --port 3000`.

## Переменные окружения

| Переменная | Назначение |
| --- | --- |
| `VITE_API_BASE` | Origin API. Пусто → формы заявок/отзывов скрыты. |
| `VITE_SITE_URL` | Канонический URL для SEO (htmlSeo-плагин). |

## Карта каталогов

| Путь | README |
| --- | --- |
| Исходники FSD | [`src/README.md`](src/README.md) |
| Слой app | [`src/app/README.md`](src/app/README.md) |
| Shared | [`src/shared/README.md`](src/shared/README.md) |
| Entities | [`src/entities/README.md`](src/entities/README.md) |
| Features | [`src/features/README.md`](src/features/README.md) |
| Спираль (главная фича) | [`src/features/section-navigation/README.md`](src/features/section-navigation/README.md) |
| Widgets | [`src/widgets/README.md`](src/widgets/README.md) |
| Статика | [`public/README.md`](public/README.md) |
| SEO-плагин | [`vite-plugins/README.md`](vite-plugins/README.md) |

## Файлы в корне `frontend/`

- **`package.json`** / **`package-lock.json`** — зависимости и скрипты.
- **`vite.config.ts`** — Vite + Vitest, alias `@`, `base: "/Portfolio/"`, плагин SEO.
- **`index.html`** — HTML-оболочка, entry на `src/app/main.tsx`.
- **`eslint.config.js`** — ESLint flat config.
- **`tsconfig.json`**, **`tsconfig.app.json`**, **`tsconfig.node.json`** — проект TypeScript (app / node tooling).

CI и Pages: корневые [`../DEPLOY.md`](../DEPLOY.md), [`.github/workflows`](../.github/workflows/README.md).
