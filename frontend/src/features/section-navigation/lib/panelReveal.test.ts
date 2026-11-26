import { afterEach, describe, expect, it, vi } from "vitest";

import { PANEL_STATE_ATTR } from "../model/panelStateAttrs";
import { rememberPanelIntrinsicHeight, revealPanelFromFrost } from "./panelReveal";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("rememberPanelIntrinsicHeight", () => {
  it("stores scrollHeight as CSS var when content is measured", () => {
    const scroll = document.createElement("div");
    Object.defineProperty(scroll, "scrollHeight", { configurable: true, get: () => 640 });
    rememberPanelIntrinsicHeight(scroll);
    expect(scroll.style.getPropertyValue("--panel-intrinsic-h")).toBe("640px");
  });
});

describe("revealPanelFromFrost", () => {
  it("clears far under frost then fades frost via revealing", async () => {
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) =>
        window.setTimeout(() => cb(performance.now()), 0) as unknown as number,
    );
    vi.useFakeTimers();
    const section = document.createElement("section");
    const scroll = document.createElement("div");
    section.append(scroll);
    section.setAttribute(PANEL_STATE_ATTR.far, "");
    section.setAttribute(PANEL_STATE_ATTR.blurLite, "");
    Object.defineProperty(scroll, "scrollHeight", { configurable: true, get: () => 500 });

    const done = revealPanelFromFrost(section, scroll);
    await vi.runAllTimersAsync();
    await done;
    expect(section.hasAttribute(PANEL_STATE_ATTR.far)).toBe(false);
    expect(section.hasAttribute(PANEL_STATE_ATTR.blurLite)).toBe(false);
    expect(section.hasAttribute(PANEL_STATE_ATTR.frost)).toBe(false);
    expect(section.hasAttribute(PANEL_STATE_ATTR.revealing)).toBe(false);
  });
});
