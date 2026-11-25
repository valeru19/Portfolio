import { describe, expect, it } from "vitest";

import { paletteForTheme, sectionPaletteAt } from "./sectionPalettes";

describe("section palettes", () => {
  it("picks dark vs light lists by theme", () => {
    expect(paletteForTheme("dark")[0].bg).toBe("#121516");
    expect(paletteForTheme("light")[0].bg).toBe("#f0efec");
  });

  it("clamps palette index to list bounds", () => {
    const first = sectionPaletteAt("dark", -3);
    const last = sectionPaletteAt("dark", 99);
    expect(first.bg).toBe(paletteForTheme("dark")[0].bg);
    expect(last.bg).toBe(paletteForTheme("dark")[8].bg);
  });
});
