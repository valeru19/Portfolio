import { apiFetch } from "./http";
import type { MessageOut, ReviewCreate, ReviewPublic } from "./types";

export function fetchApprovedReviews(): Promise<ReviewPublic[]> {
  return apiFetch<ReviewPublic[]>("/api/reviews");
}

export function createReview(payload: ReviewCreate): Promise<MessageOut> {
  return apiFetch<MessageOut>("/api/reviews", {
    method: "POST",
    body: payload,
  });
}
