import { describe, expect, it } from "vitest";

import type { SectionId } from "@/shared/content";

import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import { paintInfinityGhosts } from "./spiralTransform";

function makePanel(panel: string, border: string): { section: HTMLElement; scroll: HTMLElement } {
  const section = document.createElement("section");
  section.style.setProperty("--panel", panel);
  section.style.setProperty("--border", border);
  return { section, scroll: document.createElement("div") };
}

describe("paintInfinityGhosts slot colors", () => {
  it("keeps the same fill for a slot when firstSlot shifts (wrap rebase)", () => {
    const spiral = document.createElement("div");
    for (let i = 0; i < 4; i += 1) {
      const g = document.createElement("div");
      g.setAttribute(SPIRAL_DOM_ATTR.ghost, String(i));
      spiral.appendChild(g);
    }

    const ids = ["hero", "about", "stack"] as SectionId[];
    const panels = new Map<SectionId, { section: HTMLElement; scroll: HTMLElement }>([
      ["hero", makePanel("rgb(17, 17, 17)", "rgb(170, 170, 170)")],
      ["about", makePanel("rgb(34, 34, 34)", "rgb(187, 187, 187)")],
      ["stack", makePanel("rgb(51, 51, 51)", "rgb(204, 204, 204)")],
    ]);

    // dest в слоте N → ghosts с N+1.
    const ring = new Map<SectionId, number>([
      ["hero", 3],
      ["about", 1],
      ["stack", 2],
    ]);
    paintInfinityGhosts(spiral, ids, panels, ring);

    const ghosts = [...spiral.querySelectorAll<HTMLElement>(`[${SPIRAL_DOM_ATTR.ghost}]`)];
    // firstSlot=4: slot4→about(1), slot5→stack(2); слот 3 занят ring hero.
    expect(ghosts[0]?.style.background).toBe("rgb(34, 34, 34)");
    expect(ghosts[1]?.style.background).toBe("rgb(51, 51, 51)");
    expect(ghosts[0]?.style.border).toMatch(/none|^$/);

    const colorAtSlot5Before = ghosts[1]?.style.background;

    // После wrap: identity layout, firstSlot=3. Слот 5 = ghost2.
    paintInfinityGhosts(spiral, ids, panels, undefined);

    expect(ghosts[2]?.style.background).toBe(colorAtSlot5Before);
    // Слот 3 (ghost0) = hero.
    expect(ghosts[0]?.style.background).toBe("rgb(17, 17, 17)");
  });
});
