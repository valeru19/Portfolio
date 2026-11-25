import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SectionId } from "@/shared/content";

import { PANEL_STATE_ATTR } from "../model/panelStateAttrs";

import { useSpiralPanels } from "./useSpiralPanels";

const SECTION_IDS = ["hero", "about"] as SectionId[];

function createOverflowScrollBox(scrollHeight: number, clientHeight: number): HTMLDivElement {
  const scroll = document.createElement("div");
  Object.defineProperty(scroll, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(scroll, "clientHeight", { configurable: true, value: clientHeight });
  return scroll;
}

describe("useSpiralPanels settleActivePanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets data-scrollable on the active panel after settle (even before overflow is known)", () => {
    const currentIndexRef = { current: 0 };
    const spinningFlagRef = { current: false };
    const section = document.createElement("section");
    const scroll = createOverflowScrollBox(400, 400);

    const { result } = renderHook(() =>
      useSpiralPanels({
        sectionIds: SECTION_IDS,
        theme: "dark",
        isAccessible: false,
        currentIndexRef,
        spinningFlagRef,
      }),
    );

    act(() => {
      result.current.registerPanel("hero", section, scroll);
      result.current.settleActivePanel();
    });
    act(() => {
      vi.advanceTimersByTime(70);
    });

    expect(scroll.hasAttribute(PANEL_STATE_ATTR.scrollable)).toBe(true);
    expect(scroll.style.overflowY).toBe("scroll");
    expect(scroll.style.pointerEvents).toBe("auto");
  });

  it("does not wipe overflow styles while clearing scrollable for a turn", () => {
    const currentIndexRef = { current: 0 };
    const spinningFlagRef = { current: true };
    const scroll = createOverflowScrollBox(800, 400);
    scroll.style.overflowY = "scroll";
    scroll.style.overflowX = "hidden";
    scroll.style.pointerEvents = "auto";
    scroll.setAttribute(PANEL_STATE_ATTR.scrollable, "");

    const { result } = renderHook(() =>
      useSpiralPanels({
        sectionIds: SECTION_IDS,
        theme: "dark",
        isAccessible: false,
        currentIndexRef,
        spinningFlagRef,
      }),
    );

    act(() => {
      result.current.registerPanel("hero", document.createElement("section"), scroll);
      result.current.clearScrollable();
    });

    expect(scroll.hasAttribute(PANEL_STATE_ATTR.scrollable)).toBe(false);
    expect(scroll.style.pointerEvents).toBe("none");
    expect(scroll.style.overflowY).toBe("scroll");
    expect(scroll.style.overflowX).toBe("hidden");
  });

  it("keeps every panel visible and fully opaque when marking active", () => {
    const currentIndexRef = { current: 1 };
    const spinningFlagRef = { current: false };
    const heroSection = document.createElement("section");
    const aboutSection = document.createElement("section");
    const stackSection = document.createElement("section");

    const { result } = renderHook(() =>
      useSpiralPanels({
        sectionIds: ["hero", "about", "stack"] as SectionId[],
        theme: "dark",
        isAccessible: false,
        currentIndexRef,
        spinningFlagRef,
      }),
    );

    act(() => {
      result.current.registerPanel("hero", heroSection, createOverflowScrollBox(400, 400));
      result.current.registerPanel("about", aboutSection, createOverflowScrollBox(400, 400));
      result.current.registerPanel("stack", stackSection, createOverflowScrollBox(400, 400));
      result.current.markActive(1);
    });

    expect(heroSection.style.opacity).toBe("1");
    expect(aboutSection.style.opacity).toBe("1");
    expect(stackSection.style.opacity).toBe("1");
    expect(heroSection.style.visibility).toBe("visible");
    expect(aboutSection.hasAttribute(PANEL_STATE_ATTR.active)).toBe(true);
    expect(aboutSection.style.zIndex).toBe("5");
    expect(stackSection.style.zIndex).toBe("3");
    expect(heroSection.style.zIndex).toBe("3");
  });

  it("keeps the incoming page above other arms but under the current page", () => {
    const currentIndexRef = { current: 0 };
    const spinningFlagRef = { current: true };
    const heroSection = document.createElement("section");
    const aboutSection = document.createElement("section");
    const stackSection = document.createElement("section");

    const { result } = renderHook(() =>
      useSpiralPanels({
        sectionIds: ["hero", "about", "stack"] as SectionId[],
        theme: "dark",
        isAccessible: false,
        currentIndexRef,
        spinningFlagRef,
      }),
    );

    act(() => {
      result.current.registerPanel("hero", heroSection, createOverflowScrollBox(400, 400));
      result.current.registerPanel("about", aboutSection, createOverflowScrollBox(400, 400));
      result.current.registerPanel("stack", stackSection, createOverflowScrollBox(400, 400));
      result.current.markActive(0, { incomingIndex: 1 });
    });

    expect(heroSection.style.zIndex).toBe("5");
    expect(aboutSection.style.zIndex).toBe("4");
    expect(stackSection.style.zIndex).toBe("1");
  });

  it("enables scrollable on the explicit forIndex even if currentIndexRef lags", () => {
    const currentIndexRef = { current: 0 };
    const spinningFlagRef = { current: false };
    const heroSection = document.createElement("section");
    const aboutSection = document.createElement("section");
    const heroScroll = createOverflowScrollBox(800, 400);
    const aboutScroll = createOverflowScrollBox(800, 400);

    const { result } = renderHook(() =>
      useSpiralPanels({
        sectionIds: SECTION_IDS,
        theme: "dark",
        isAccessible: false,
        currentIndexRef,
        spinningFlagRef,
      }),
    );

    act(() => {
      result.current.registerPanel("hero", heroSection, heroScroll);
      result.current.registerPanel("about", aboutSection, aboutScroll);
      currentIndexRef.current = 1;
      result.current.settleActivePanel(1);
    });
    act(() => {
      vi.advanceTimersByTime(70);
    });

    expect(aboutScroll.hasAttribute(PANEL_STATE_ATTR.scrollable)).toBe(true);
    expect(heroScroll.hasAttribute(PANEL_STATE_ATTR.scrollable)).toBe(false);
  });

  it("warms destination panels without hiding them", () => {
    const currentIndexRef = { current: 1 };
    const spinningFlagRef = { current: true };
    const aboutSection = document.createElement("section");
    aboutSection.style.opacity = "0";
    aboutSection.style.visibility = "hidden";

    const { result } = renderHook(() =>
      useSpiralPanels({
        sectionIds: SECTION_IDS,
        theme: "dark",
        isAccessible: false,
        currentIndexRef,
        spinningFlagRef,
      }),
    );

    act(() => {
      result.current.registerPanel("about", aboutSection, createOverflowScrollBox(400, 400));
      result.current.warmAround(1);
    });

    expect(aboutSection.style.opacity).toBe("1");
    expect(aboutSection.style.visibility).toBe("visible");
  });

  it("skips redundant z-index writes when markActive repeats", () => {
    const currentIndexRef = { current: 0 };
    const spinningFlagRef = { current: false };
    const heroSection = document.createElement("section");

    const { result } = renderHook(() =>
      useSpiralPanels({
        sectionIds: SECTION_IDS,
        theme: "dark",
        isAccessible: false,
        currentIndexRef,
        spinningFlagRef,
      }),
    );

    act(() => {
      result.current.registerPanel("hero", heroSection, createOverflowScrollBox(400, 400));
      result.current.markActive(0);
    });
    const firstZ = heroSection.style.zIndex;
    act(() => {
      result.current.markActive(0);
    });
    expect(heroSection.style.zIndex).toBe(firstZ);
    expect(heroSection.style.zIndex).toBe("5");
  });
});
