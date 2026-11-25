import { content } from "@/shared/content";
import type { Lang } from "@/shared/i18n";
import { translate } from "@/shared/i18n";

import { ApiError, type ApiErrorCode } from "./types";

type FormKind = "apply" | "review" | "loadReviews";

export function messageForApiError(lang: Lang, error: unknown, kind: FormKind): string {
  const code: ApiErrorCode =
    error instanceof ApiError ? error.code : error instanceof TypeError ? "network" : "unknown";

  if (code === "rate_limit") {
    return kind === "apply"
      ? translate(lang, content.apply.tooManyRequests)
      : translate(lang, content.reviews.tooManyRequests);
  }

  if (kind === "loadReviews") {
    return translate(lang, content.reviews.loadError);
  }

  if (kind === "apply") {
    return translate(lang, content.apply.error);
  }

  return translate(lang, content.reviews.error);
}
