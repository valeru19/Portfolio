# `section-navigation/ui`

Разметка и CSS спирали.

## Файлы

- **`SpiralNavigationProvider.tsx`** — поднимает `useSpiralNavigation` и Context для дерева.
- **`SpiralStage.tsx`** / **`SpiralStage.module.css`** — `<main>` + контейнер `.spiral` (fixed / accessible static); `will-change` на спирали; `data-spiral-root`.
- **`NavSection.tsx`** / **`NavSection.module.css`** — оболочка секции: spiral absolute panel vs accessible document flow; регистрация в `registerPanel`; click-to-jump; `content-visibility` для far + freeze на `is-spinning`; скролл панели через `data-scrollable`.
- **`SpiralHud.tsx`** / **`SpiralHud.module.css`** — счётчик «01 of 07», точки секций, Next; скрыт в accessible.
- **`ModeToggle.tsx`** / **`ModeToggle.module.css`** — кнопка «обычный скролл» / обратно на спираль.

Виджет [`widgets/spiral-nav`](../../../widgets/spiral-nav/README.md) обычно монтирует HUD + toggle рядом с хедером; секции контента используют `NavSection`.
