import { describe, expect, it } from "vitest";

import { sectionPaletteForId } from "@/shared/content/sectionPalettes";

import { paintPanelPalette, paintPanelPaletteForId } from "./paintPanelPalette";

describe("paintPanelPalette", () => {
  it("writes scoped tokens without inline background (so CSS can round the fill)", () => {
    const section = document.createElement("section");
    section.style.backgroundColor = "rgb(1, 2, 3)";
    const palette = sectionPaletteForId("dark", "stack");
    paintPanelPalette(section, palette);
    expect(section.style.backgroundColor).toBe("");
    expect(section.style.getPropertyValue("--panel")).toBe(palette.panel);
    expect(section.style.getPropertyValue("--text")).toBe(palette.fg);
    expect(section.style.getPropertyValue("--border")).toBe(palette.border);
    expect(section.style.getPropertyValue("--stage-fg")).toBe(palette.fg);
    expect(section.style.getPropertyValue("--stage-bg")).toBe(palette.bg);
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
    expect(stack.style.getPropertyValue("--panel")).not.toBe(
      experience.style.getPropertyValue("--panel"),
    );
  });
});
