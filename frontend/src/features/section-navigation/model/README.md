# `section-navigation/model`

Чистая логика и константы без React/DOM (удобно тестировать).

## Файлы

- **`constants.ts`** — φ (`ASPECT`), ось, размер панели, пороги колеса, `PANEL_BLUR_PX`, ключи режима spiral/accessible.
- **`geometry.ts`** (+ **`.test.ts`**) — layout панели, scale/rotation по индексу, snap rotation ↔ index.
- **`sectionIndex.ts`** — clamp / step индекса секции.
- **`panelScroll.ts`** (+ **`.test.ts`**) — смягчение wheel-дельты и lerp scrollTop внутри панели.
- **`wheelLock.ts`** (+ **`.test.ts`**) — аккумулятор колеса и временной lock шага.
- **`panelStateAttrs.ts`** — имена `data-active` / `data-far` / `data-scrollable` и `data-spiral-*`; `setPanelStateAttr`.
- **`panelStateCssCoupling.test.ts`** — что CSS Modules селекторы согласованы с attrs.
- **`navigationContext.ts`** — TypeScript-тип значения Context навигации.
- **`prefersReducedMotion.ts`** — чтение media query.
- **`accessibleHeaderHide.ts`** (+ **`.test.ts`**) — чистая функция «прятать ли хедер» по scrollY/focus.

Импортируется hooks и lib; не импортирует UI.
