import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createReview } from "@/shared/api";
import type { ReviewCreate } from "@/shared/api";
import { APPROVED_REVIEWS_QUERY_KEY } from "@/entities/review";

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReviewCreate) => createReview(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPROVED_REVIEWS_QUERY_KEY });
    },
  });
}
