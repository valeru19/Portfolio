import { describe, expect, it } from "vitest";

import { reviewFormSchema } from "./schema";

describe("reviewFormSchema", () => {
  it("accepts a valid review", () => {
    const parsed = reviewFormSchema.parse({
      name: "Anna",
      text: "Great collaboration on the backend work.",
      rating: "5",
      privacyConsent: true,
    });
    expect(parsed.rating).toBe(5);
  });

  it("rejects out-of-range rating and missing consent", () => {
    const result = reviewFormSchema.safeParse({
      name: "Anna",
      text: "Great collaboration on the backend work.",
      rating: 6,
      privacyConsent: false,
    });
    expect(result.success).toBe(false);
  });
});
