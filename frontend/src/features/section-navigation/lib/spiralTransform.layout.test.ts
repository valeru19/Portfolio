import { describe, expect, it } from "vitest";

import type { SectionId } from "@/shared/content";

import { applySpiralLayoutToPanels } from "./spiralTransform";

describe("applySpiralLayoutToPanels", () => {
  it("re-applies panel sizes after remount even when viewport is unchanged", () => {
    const spiral = document.createElement("div");
    const first = document.createElement("section");
    const second = document.createElement("section");
    const ids = ["hero", "about"] as SectionId[];

    applySpiralLayoutToPanels(
      spiral,
      ids,
      new Map([
        ["hero", { section: first, scroll: document.createElement("div") }],
        ["about", { section: second, scroll: document.createElement("div") }],
      ]),
      null,
    );

    expect(first.style.width).toMatch(/px$/);
    expect(first.style.height).toMatch(/px$/);
    const width = first.style.width;
    const height = first.style.height;

    // Симуляция remount accessible↔spiral: новые DOM-узлы без inline sizes.
    const remounted = document.createElement("section");
    applySpiralLayoutToPanels(
      spiral,
      ids,
      new Map([
        ["hero", { section: remounted, scroll: document.createElement("div") }],
        ["about", { section: document.createElement("section"), scroll: document.createElement("div") }],
      ]),
      null,
    );

    expect(remounted.style.width).toBe(width);
    expect(remounted.style.height).toBe(height);
    expect(remounted.style.transform).toContain("rotate");
  });
});
