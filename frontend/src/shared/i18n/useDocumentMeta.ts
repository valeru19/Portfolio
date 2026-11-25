import { useEffect } from "react";

import { meta } from "@/shared/content/meta";

import { useI18n } from "./useI18n";

/**
 * Keeps document title and meta description aligned with the active language.
 * Build-time SEO tags in dist/index.html remain the crawler-facing baseline.
 */
export function useDocumentMeta(): void {
  const { lang } = useI18n();

  useEffect(() => {
    document.title = meta.title[lang];

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", meta.description[lang]);
    }
  }, [lang]);
}
