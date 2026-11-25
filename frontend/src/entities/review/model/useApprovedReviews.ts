import { useQuery } from "@tanstack/react-query";

import { fetchApprovedReviews } from "@/shared/api";
import { isApiConfigured } from "@/shared/config";

export const APPROVED_REVIEWS_QUERY_KEY = ["reviews", "approved"] as const;

export function useApprovedReviews() {
  return useQuery({
    queryKey: APPROVED_REVIEWS_QUERY_KEY,
    queryFn: fetchApprovedReviews,
    enabled: isApiConfigured(),
  });
}
