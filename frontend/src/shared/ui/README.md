# `shared/ui` — UI-kit

Примитивы без доменной логики. Стили — соседние `*.module.css`.

## Файлы

- **`Button.tsx`** / **`Button.module.css`** — кнопка (варианты primary и др.).
- **`Field.tsx`** / **`Field.module.css`** — поле ввода/textarea для форм.
- **`Tag.tsx`** / **`Tag.module.css`** — чип/тег технологий.
- **`Container.tsx`** / **`Container.module.css`** — ограничитель ширины контента.
- **`Section.tsx`** / **`Section.module.css`** — обёртка секции (accessible layout).
- **`SectionHead.tsx`** / **`SectionHead.module.css`** — заголовок + лид секции.
- **`index.ts`** — баррель.

Виджеты и формы фич собираются из этих кирпичей. В режиме спирали оболочка секции часто идёт через `NavSection`, а не `Section`.
