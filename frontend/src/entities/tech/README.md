# `entities/tech`

## Файлы

- **`TechLogo.tsx`** — логотип технологии из `public/assets` (+ `assetUrl`).
- **`TechLogo.module.css`** — тайлы; на `body.is-spinning` анимация паузится, чтобы не дёргать GPU во время спирали.
- **`TechTag.tsx`** — тег поверх `shared/ui/Tag` + опциональный логотип.
- **`index.ts`** — экспорт.

Виджеты `stack` и `experience` (блок технологий) используют эти компоненты.
