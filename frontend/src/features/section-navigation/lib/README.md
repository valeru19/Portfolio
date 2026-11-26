# `section-navigation/lib`

Императивная работа с DOM/анимацией вне React-рендера (горячий путь кадра).

## Файлы

- **`loadGsap.ts`** — динамический `import("gsap")`, кэш промиса, `force3D: "auto"`, lagSmoothing.
- **`spiralTransform.ts`** — `paintSpiralElement`, layout панелей (опц. слоты для wrap), длительность/ease твина.
- **`sectionHash.ts`** — `#sectionId` ↔ индекс, `replaceState` без push истории.
- **`panelLayerAnimator.ts`** (+ **`.test.ts`**) — один WAAPI-аниматор opacity на слой: `readLayerOpacity` / `commitStyles` / continue-from-current, ease-in-out, 480 мс.
- **`panelViewDom.ts`** — cover/veil selectors, idle radius без инлайнового `--panel-veil` (иначе hover ломается).
- **`panelViewTransitions.ts`** — solid↔blur↔sharp; sharp→blur напрямую (cover=0); prepare under cover.
- **`panelViewTurn.ts`** — `beginPanelViewTurn` / settle / reveal / `prepareLongJumpViews` (dest+dest+1); вперёд i+2 cover fade с начала хода.
- **`panelViewIdle.ts`** — мгновенные idle-виды.
- **`panelViewController.ts`** — тонкий public re-export (+ **`.test.ts`**).
- **`panelBlur.ts`** — veil amount / радиус backdrop helpers.
- **`panelReveal.ts`** — decode / intrinsic height.
- **`paintPanelPalette.ts`** / **`applyPaletteToDocument.ts`** — палитры панели и stage.

Запечённый blur (`panelBake`) удалён в шаге 18.

Вызываются из `useSpiralMotion` / `useSpiralPanels` / DomEffects.
