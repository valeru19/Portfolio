import { describe, expect, it } from "vitest";

import { rememberPanelIntrinsicHeight } from "./panelReveal";

describe("rememberPanelIntrinsicHeight", () => {
  it("stores scrollHeight as CSS var when content is measured", () => {
    const scroll = document.createElement("div");
    Object.defineProperty(scroll, "scrollHeight", { configurable: true, get: () => 640 });
    rememberPanelIntrinsicHeight(scroll);
    expect(scroll.style.getPropertyValue("--panel-intrinsic-h")).toBe("640px");
  });
});
