# Scripts

## `measure-spiral-perf.mjs`

Chromium (Playwright) rAF-замер flip’ов спирали: avg/max кадра, число кадров >50 ms и >100 ms.

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
node scripts/measure-spiral-perf.mjs http://127.0.0.1:4173/Portfolio/
```

Программный рендеринг Chromium **не** заменяет замер на GPU. Для живого железа откройте сайт с `?perf=1` (в `npm run dev` или при `VITE_PERF=1` в preview/build) и смотрите оверлей + `console.table` после каждого хода.
