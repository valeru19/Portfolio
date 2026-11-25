import { describe, expect, it } from "vitest";

import { applicationFormSchema } from "./schema";

describe("applicationFormSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = applicationFormSchema.parse({
      name: "  Ivan  ",
      contact: " @ivan ",
      kind: "job",
      message: "Hello there, this is long enough.",
      privacyConsent: true,
    });

    expect(parsed.name).toBe("Ivan");
    expect(parsed.contact).toBe("@ivan");
    expect(parsed.kind).toBe("job");
  });

  it("rejects short fields and missing consent", () => {
    const result = applicationFormSchema.safeParse({
      name: "A",
      contact: "ab",
      kind: "order",
      message: "short",
      privacyConsent: false,
    });

    expect(result.success).toBe(false);
  });
});
