import { describe, expect, it } from "vitest";

import { sectionIndexFromHash } from "./sectionHash";

describe("sectionIndexFromHash", () => {
  const ids = ["hero", "about", "stack"] as const;

  it("parses known hash", () => {
    expect(sectionIndexFromHash("#about", ids)).toBe(1);
    expect(sectionIndexFromHash("stack", ids)).toBe(2);
  });

  it("returns null for unknown or empty", () => {
    expect(sectionIndexFromHash("#nope", ids)).toBeNull();
    expect(sectionIndexFromHash("#", ids)).toBeNull();
    expect(sectionIndexFromHash("", ids)).toBeNull();
  });
});
