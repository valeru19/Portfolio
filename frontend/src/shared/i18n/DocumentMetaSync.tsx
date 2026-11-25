import { useDocumentMeta } from "./useDocumentMeta";

/** Mount inside I18nProvider to sync title/description with language. */
export function DocumentMetaSync(): null {
  useDocumentMeta();
  return null;
}
