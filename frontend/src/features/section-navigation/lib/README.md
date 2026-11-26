# `section-navigation/lib`

Императивная работа с DOM/анимацией вне React-рендера (горячий путь кадра).

## Файлы

- **`loadGsap.ts`** — динамический `import("gsap")`, кэш промиса, `force3D: "auto"`, lagSmoothing. Не тянет GSAP в accessible-бандл до нужды.
- **`spiralTransform.ts`** — `paintSpiralElement` (rotate+scale спирали), `applySpiralLayoutToPanels` (размеры/pose каждой панели; идемпотентные width/height после remount), длительность/ease твина.
- **`spiralTransform.test.ts`** — duration/ease.
- **`spiralTransform.layout.test.ts`** — размеры после remount (баг accessible↔spiral).
- **`panelBlur.ts`** — `paintPanelBlur`, `blurPxForTurnProgress` (from↑ / dest↓ / other max), константа через `PANEL_BLUR_PX`.
- **`panelBlur.test.ts`** — юнит-тесты blur-математики.
- **`paintPanelPalette.ts`** (+ **`.test.ts`**) — CSS-переменные палитры на конкретной панели (чтобы контент не мигал чужим `--panel`).
- **`applyPaletteToDocument.ts`** — пишет stage/body CSS-переменные при смене секции (`applyColors`).

Вызываются из `useSpiralMotion` / `useSpiralPanels` / DomEffects.
