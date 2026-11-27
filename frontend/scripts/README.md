# Scripts

Три утилиты для спирали (Playwright / Chromium).

## `measure-spiral-perf.mjs`

rAF-замер: avg / p95 / max кадра, >50 ms / >100 ms. Сценарии: одиночные ходы, «Наверх», ход после «Наверх», пружина (по 5 прогонов).

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
node scripts/measure-spiral-perf.mjs http://127.0.0.1:4173/Portfolio/ --software
```

Программный Chromium **не** заменяет замер на GPU. Для живого Chrome: `?perf=1` (`npm run dev` или сборка с `VITE_PERF=1`).

## `trace-nasp.mjs`

Chromium tracing для «Наверх»: худшие кадры и типы событий → `scripts/nasp-trace.json`.

## `assert-spiral-behavior.mjs`

Сэмпл каждый кадр: виды слотов, ≤1 живой blur (0 на последней), пружина не меняет виды/hash.
