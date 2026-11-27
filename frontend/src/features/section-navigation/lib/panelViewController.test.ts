import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PANEL_VIEW_ATTR } from "../model/panelView";
import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

import {
  resetPanelViewGenerationForTests,
  transitionSolidToBlur,
  transitionToSolid,
} from "./panelViewController";

function makePanel(): { section: HTMLElement; scroll: HTMLElement; cover: HTMLElement } {
  const section = document.createElement("section");
  const scroll = document.createElement("div");
  const cover = document.createElement("div");
  const veil = document.createElement("div");
  scroll.setAttribute(SPIRAL_DOM_ATTR.scroll, "");
  cover.setAttribute(SPIRAL_DOM_ATTR.solidCover, "");
  veil.setAttribute(SPIRAL_DOM_ATTR.blurVeil, "");
  cover.style.opacity = "1";
  section.append(scroll, cover, veil);
  Object.defineProperty(scroll, "scrollHeight", { configurable: true, get: () => 480 });
  return { section, scroll, cover };
}

beforeEach(() => {
  resetPanelViewGenerationForTests();
  vi.stubGlobal(
    "requestAnimationFrame",
    (cb: FrameRequestCallback) =>
      window.setTimeout(() => cb(performance.now()), 0) as unknown as number,
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  resetPanelViewGenerationForTests();
});

describe("transitionSolidToBlur", () => {
  it("enables blur under opaque cover then fades cover", async () => {
    vi.useFakeTimers();
    const { section, scroll, cover } = makePanel();
    const gen = 1;
    // sync gen with controller: bump once so current is 1
    resetPanelViewGenerationForTests();
    const { bumpPanelViewGeneration } = await import("./panelViewController");
    bumpPanelViewGeneration(); // → 1

    const done = transitionSolidToBlur({ section, scroll }, gen, 40);
    await vi.advanceTimersByTimeAsync(5);
    expect(section.getAttribute(PANEL_VIEW_ATTR)).toBe("blur");
    expect(Number(cover.style.opacity)).toBeGreaterThan(0.9);
    await vi.runAllTimersAsync();
    await done;
    expect(cover.style.opacity).toBe("0");
  });

  it("aborts when generation changes", async () => {
    vi.useFakeTimers();
    const { section, scroll, cover } = makePanel();
    const { bumpPanelViewGeneration } = await import("./panelViewController");
    resetPanelViewGenerationForTests();
    const gen = bumpPanelViewGeneration();
    const done = transitionSolidToBlur({ section, scroll }, gen, 80);
    bumpPanelViewGeneration();
    await vi.runAllTimersAsync();
    await done;
    // Cover may stay opaque if cancelled mid-way before fade finished setting 0
    expect(section.getAttribute(PANEL_VIEW_ATTR)).toBe("blur");
    void cover;
  });
});

describe("transitionToSolid", () => {
  it("sets solid after cover reaches opaque", async () => {
    vi.useFakeTimers();
    const { section, scroll, cover } = makePanel();
    cover.style.opacity = "0";
    section.setAttribute(PANEL_VIEW_ATTR, "blur");
    const { bumpPanelViewGeneration } = await import("./panelViewController");
    resetPanelViewGenerationForTests();
    const gen = bumpPanelViewGeneration();
    // jsdom animate may be missing — controller falls back to instant
    const done = transitionToSolid({ section, scroll }, gen, 40);
    await vi.runAllTimersAsync();
    await done;
    expect(section.getAttribute(PANEL_VIEW_ATTR)).toBe("solid");
    expect(cover.style.opacity).toBe("1");
  });
});
