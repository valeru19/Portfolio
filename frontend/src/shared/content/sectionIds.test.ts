import { describe, expect, it } from "vitest";

import { getSectionIndexLabel, getVisibleSectionIds } from "./sectionIds";

describe("section visibility", () => {
  it("hides reviews and apply when API is disabled", () => {
    const ids = getVisibleSectionIds({ apiEnabled: false, hasContactChannel: true });
    expect(ids).not.toContain("reviews");
    expect(ids).not.toContain("apply");
    expect(ids).toContain("contacts");
  });

  it("hides reviews and apply when contact channel is missing even if API is set", () => {
    const ids = getVisibleSectionIds({ apiEnabled: true, hasContactChannel: false });
    expect(ids).not.toContain("reviews");
    expect(ids).not.toContain("apply");
  });

  it("includes reviews and apply when API and contact channel are available", () => {
    const ids = getVisibleSectionIds({ apiEnabled: true, hasContactChannel: true });
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
