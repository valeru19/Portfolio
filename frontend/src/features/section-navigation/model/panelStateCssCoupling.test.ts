import { describe, expect, it } from "vitest";

import { PANEL_STATE_ATTR } from "./panelStateAttrs";

/**
 * Без node:fs/path — иначе tsc -b падает (tsconfig.app без @types/node).
 * Vite отдаёт CSS как raw-строки через import.meta.glob.
 */
const moduleCss = import.meta.glob("../ui/*.module.css", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const globalCssModules = import.meta.glob("../../app/styles/global.css", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function collectCssSources(): string {
  return [...Object.values(moduleCss), ...Object.values(globalCssModules)].join("\n");
}

describe("panel state CSS coupling", () => {
  it("defines a selector for every data attribute toggled by spiral panel hooks", () => {
    const cssBundle = collectCssSources();
    const missing = Object.values(PANEL_STATE_ATTR).filter(
      (attr) => !cssBundle.includes(`[${attr}]`),
    );
    expect(missing, `CSS missing rules for: ${missing.join(", ")}`).toEqual([]);
  });

  it("flat/solid has no border and hides scroll content (step 17)", () => {
    const cssBundle = collectCssSources();
    expect(cssBundle).toMatch(/data-panel-view="solid"[\s\S]*?border:\s*none/);
    expect(cssBundle).toMatch(/data-panel-view="solid"[\s\S]*?content-visibility:\s*hidden/);
    expect(cssBundle).toMatch(/data-panel-view="blur"[\s\S]*?backdrop-filter:\s*blur/);
  });
});
