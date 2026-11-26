# `shared/i18n` — язык интерфейса

Контекст локали (`ru` / `en`), хуки перевода и синхронизация `<title>` / meta.

## Файлы

- **`types.ts`** — тип локали и структуры словарей.
- **`context.ts`** — React Context значения i18n.
- **`I18nProvider.tsx`** — хранит локаль, пишет в `localStorage` (`storageKeys`), отдаёт `t`/setter.
- **`useI18n.ts`** / **`useT.ts`** — хуки доступа к контексту и короткому `t()`.
- **`useDocumentMeta.ts`** — вычисляет title/description из `content/meta`.
- **`DocumentMetaSync.tsx`** — эффект, обновляющий `document.title` и meta при смене языка.
- **`i18n.test.tsx`** — тесты провайдера/переключения.
- **`index.ts`** — баррель.

## Связи

Провайдер в [`app/providers`](../../app/providers/README.md). Переключатель — [`features/switch-language`](../../features/switch-language/README.md). Строки — [`content`](../content/README.md).
