# `frontend/public` — статика без обработки бандлером

Файлы отдаются as-is по URL с учётом Vite `base` (`/Portfolio/`).

## Файлы

- **`favicon.svg`** — иконка вкладки (ссылка из `index.html`).
- **`icons.svg`** — спрайт/набор иконок при необходимости.
- [`assets/`](assets/README.md) — логотипы технологий и соцсетей.

Опционально сюда же кладут `og-image.*` для Open Graph (см. `vite-plugins/htmlSeo`).
