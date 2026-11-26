import { useEffect } from "react";

import { meta } from "@/shared/content/meta";

import { useI18n } from "./useI18n";

/**
 * Держит document title и meta description в синхроне с активным языком.
 * SEO-теги сборки в dist/index.html остаются базой для краулеров.
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
