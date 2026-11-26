# `shared/content` — контент лендинга

Тексты секций на RU/EN и служебные идентификаторы. Виджеты почти не содержат хардкода строк — берут данные отсюда через `useT` / объекты `content.*`.

## Файлы

- **`index.ts`** — агрегатор экспортов и тип `SectionId`.
- **`sectionIds.ts`** (+ **`.test.ts`**) — упорядоченный список секций спирали (`hero`…`contacts`). Критичен для `section-navigation`.
- **`sectionPalettes.ts`** (+ **`.test.ts`**) — цвета каждой секции (light/dark). Красят документ и панели через `paintPanelPalette` / `applyPaletteToDocument`.
- **`hero.ts`**, **`about.ts`**, **`stack.ts`**, **`stack.pending.ts`**, **`experience.ts`**, **`projects.ts`**, **`education.ts`**, **`contacts.ts`**, **`apply.ts`**, **`reviews.ts`**, **`footer.ts`**, **`nav.ts`**, **`spiral.ts`**, **`a11y.ts`**, **`meta.ts`**, **`privacy.ts`** — словари строк/структур для соответствующих виджетов и SEO.
- **`content.test.ts`** — целостность контента (ключи, секции).

Правки текстов резюме — в первую очередь сюда, не в JSX виджетов.
