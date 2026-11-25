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

  it("sets data-scrollable on the active panel when content overflows", () => {
    const currentIndexRef = { current: 0 };
    const spinningFlagRef = { current: false };
    const section = document.createElement("section");
    const scroll = createOverflowScrollBox(1200, 400);

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

    expect(scroll.hasAttribute(PANEL_STATE_ATTR.scrollable)).toBe(false);

    act(() => {
      vi.advanceTimersByTime(90);
    });

    expect(scroll.hasAttribute(PANEL_STATE_ATTR.scrollable)).toBe(true);
  });
});
