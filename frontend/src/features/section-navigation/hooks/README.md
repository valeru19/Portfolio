# `section-navigation/hooks`

React-хуки оркестрации спирали. Не содержат разметки — только состояние и DOM-эффекты.

## Файлы

- **`useSpiralNavigation.ts`** — фасад: `currentIndex` / `targetIndex` / `goTo` / `goNext` / `goPrev`, очередь `pendingIndex` (новый шаг только после завершения твина), сборка всех подхуков. Отдаёт значение в Context.
- **`useSpiralNavigationContext.ts`** — чтение контекста из UI (`NavSection`, HUD, ModeToggle).
- **`useSpiralMotion.ts`** — GSAP-твин вращения/scale спирали; sync-старт если GSAP уже в кэше; rebuild матриц до reverse; на `onUpdate` — transform + **crossfade blur** (уходящая ↔ входящая); `finishScroll` → markActive/colors/settle.
- **`useSpiralPanels.ts`** — реестр панелей, `markActive` (z-index, far, idle blur), `applyColors`, `warmAround`, `settleActivePanel` (data-scrollable без инлайн overflow).
- **`useSpiralPanels.test.tsx`** — тесты settle/markActive/warm.
- **`useSpiralDomEffects.ts`** — переключение accessible↔spiral (сброс стилей / sync rebuild+paint), resize rebuild, scroll-spy в accessible.
- **`useAccessibleMode.ts`** (+ **`.test.tsx`**) — флаг обычного скролла, `prefers-reduced-motion`, persistence `STORAGE_MODE`.
- **`useAccessibleHeaderHide.ts`** — прячет хедер при скролле в accessible (логика в `model/accessibleHeaderHide`).
- **`useWheelStep.ts`** — колесо: порог, lock, скролл внутри активной панели vs шаг секции (`model/wheelLock`, `panelScroll`).
- **`useTouchStep.ts`** — свайп вверх/вниз → `onStep`.
- **`useKeyboardStep.ts`** — стрелки / PageUp/Down → шаг секции.

## Связи

Геометрия и константы — [`../model`](../model/README.md); paint — [`../lib`](../lib/README.md); UI подписывается через Context.
