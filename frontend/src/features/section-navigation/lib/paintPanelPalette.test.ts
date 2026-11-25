import { describe, expect, it } from "vitest";

import { sectionPaletteForId } from "@/shared/content/sectionPalettes";

import { paintPanelPalette, paintPanelPaletteForId } from "./paintPanelPalette";

describe("paintPanelPalette", () => {
  it("writes panel/fg/border and scoped tokens onto the section element", () => {
    const section = document.createElement("section");
    const palette = sectionPaletteForId("dark", "stack");
    paintPanelPalette(section, palette);
    expect(section.style.backgroundColor).toBe("rgb(79, 143, 122)");
    expect(section.style.color).toBe("rgb(7, 31, 24)");
    expect(section.style.borderColor).toBe("rgb(13, 42, 34)");
    expect(section.style.getPropertyValue("--panel")).toBe(palette.panel);
    expect(section.style.getPropertyValue("--text")).toBe(palette.fg);
  });

  it("scopes light contacts tokens so chip text keeps contrast on the panel", () => {
    const section = document.createElement("section");
    const palette = sectionPaletteForId("light", "contacts");
    paintPanelPalette(section, palette);
    expect(section.style.getPropertyValue("--text")).toBe(palette.fg);
    expect(section.style.getPropertyValue("--panel")).toBe(palette.panel);
    expect(palette.fg.toLowerCase()).not.toBe(palette.panel.toLowerCase());
  });

  it("keeps distinct surfaces for neighboring sections", () => {
    const stack = document.createElement("section");
    const experience = document.createElement("section");
    paintPanelPaletteForId(stack, "dark", "stack");
    paintPanelPaletteForId(experience, "dark", "experience");
    expect(stack.style.backgroundColor).not.toBe(experience.style.backgroundColor);
  });
});
