import { useDocumentMeta } from "./useDocumentMeta";

/** Монтировать внутри I18nProvider — синхронизация title/description с языком. */
export function DocumentMetaSync(): null {
  useDocumentMeta();
  return null;
}
