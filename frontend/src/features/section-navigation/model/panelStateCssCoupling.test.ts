import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PANEL_STATE_ATTR } from "./panelStateAttrs";

const featureRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const globalCssPath = join(featureRoot, "../../app/styles/global.css");

function collectCssSources(): string {
  const moduleFiles = readdirSync(join(featureRoot, "ui"))
    .filter((name) => name.endsWith(".module.css"))
    .map((name) => readFileSync(join(featureRoot, "ui", name), "utf8"));
  const globalCss = readFileSync(globalCssPath, "utf8");
  return [...moduleFiles, globalCss].join("\n");
}

describe("panel state CSS coupling", () => {
  it("defines a selector for every data attribute toggled by spiral panel hooks", () => {
    const cssBundle = collectCssSources();
    const missing = Object.values(PANEL_STATE_ATTR).filter(
      (attr) => !cssBundle.includes(`[${attr}]`),
    );
    expect(missing, `CSS missing rules for: ${missing.join(", ")}`).toEqual([]);
  });
});
