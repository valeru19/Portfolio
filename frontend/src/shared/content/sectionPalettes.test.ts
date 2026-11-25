import { describe, expect, it } from "vitest";

import { paletteForTheme, sectionPaletteAt, sectionPaletteForId } from "./sectionPalettes";

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

  it("keeps contacts palette when reviews/apply slots are skipped in the spiral", () => {
    // Visible index 6 would wrongly be reviews olive; contacts must stay its own slot.
    expect(sectionPaletteForId("dark", "contacts").bg).toBe("#3a2418");
    expect(sectionPaletteForId("light", "contacts").bg).toBe("#a86b3e");
    expect(sectionPaletteForId("dark", "reviews").bg).toBe("#171814");
  });

  it("never uses paper-white surfaces in dark theme", () => {
    const paperWhite = (hex: string) => {
      const value = hex.replace("#", "");
      const r = Number.parseInt(value.slice(0, 2), 16);
      const g = Number.parseInt(value.slice(2, 4), 16);
      const b = Number.parseInt(value.slice(4, 6), 16);
      // Relative luminance threshold — blocks cream/white panels in dark mode.
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.72;
    };
    for (const palette of paletteForTheme("dark")) {
      expect(paperWhite(palette.bg), `bg ${palette.bg}`).toBe(false);
      expect(paperWhite(palette.panel), `panel ${palette.panel}`).toBe(false);
    }
  });
});
