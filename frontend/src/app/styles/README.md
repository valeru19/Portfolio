# `app/styles` — глобальные стили

Токены дизайна и базовые правила документа. Подключаются один раз при старте приложения.

## Файлы

- **`tokens.css`** — CSS-переменные (`--panel`, `--stage-bg`, `--text`, шрифты…). Палитры секций из `section-navigation` перезаписывают часть переменных на `:root` / панелях.
- **`reset.css`** — нормализация box-model / отступов.
- **`global.css`** — `html`/`body`, accessible vs spiral overflow, `body.is-spinning` (отключение transition во время переворота спирали).
- **`index.ts`** — side-effect импорт CSS в бандл.

## Связи

Спин-класс `is-spinning` ставит [`features/section-navigation`](../../features/section-navigation/README.md). Режим `is-accessible` — `useAccessibleMode`.
