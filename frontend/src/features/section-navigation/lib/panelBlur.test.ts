import { describe, expect, it } from "vitest";

import { PANEL_BLUR_RADIUS_VAR } from "./panelBlur";

describe("PANEL_BLUR_RADIUS_VAR", () => {
  it("names the CSS custom property used by panel blur", () => {
    expect(PANEL_BLUR_RADIUS_VAR).toBe("--panel-blur-radius");
  });
});
