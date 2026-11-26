# `section-navigation/lib`

Императивная работа с DOM/анимацией вне React-рендера (горячий путь кадра).

## Файлы

- **`loadGsap.ts`** — динамический `import("gsap")`, кэш промиса, `force3D: "auto"`, lagSmoothing.
- **`spiralTransform.ts`** — `paintSpiralElement`, layout панелей, длительность/ease твина (шаг 17 reverse).
- **`panelViewController.ts`** (+ **`.test.ts`**) — переходы `solid↔blur↔sharp` через opacity solid-cover (WAAPI), generation-счётчик отмены; бюджет ≤1 blur.
- **`panelBlur.ts`** — veil amount / радиус backdrop, WAAPI blur-turn helpers.
- **`panelReveal.ts`** — `PANEL_REVEAL_MS`, `decodePanelImages`, `rememberPanelIntrinsicHeight`.
- **`paintPanelPalette.ts`** / **`applyPaletteToDocument.ts`** — палитры панели и stage.

Запечённый blur (`panelBake`) удалён в шаге 18.

Вызываются из `useSpiralMotion` / `useSpiralPanels` / DomEffects.
