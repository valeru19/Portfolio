import { describe, expect, it } from "vitest";

import { getSectionIndexLabel, getVisibleSectionIds } from "./sectionIds";

describe("section visibility", () => {
  it("hides reviews and apply when API is disabled", () => {
    const ids = getVisibleSectionIds(false);
    expect(ids).not.toContain("reviews");
    expect(ids).not.toContain("apply");
    expect(ids).toContain("contacts");
  });

  it("includes reviews and apply when API is enabled", () => {
    const ids = getVisibleSectionIds(true);
    expect(ids).toEqual([
      "hero",
      "about",
      "stack",
      "experience",
      "projects",
      "education",
      "reviews",
      "apply",
      "contacts",
    ]);
    expect(getSectionIndexLabel("contacts", ids)).toBe("08");
  });
});
