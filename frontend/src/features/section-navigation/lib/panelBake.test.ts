import { afterEach, describe, expect, it, vi } from "vitest";

import { bakePanelPlate, clearPanelBakeCache, estimateBakeCacheBytes } from "./panelBake";

afterEach(() => {
  clearPanelBakeCache();
  vi.restoreAllMocks();
});

describe("bakePanelPlate", () => {
  it("returns a data url from a half-res canvas bake", () => {
    const ctx = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      globalAlpha: 1,
      filter: "none",
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      drawImage: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      // обоснование: jsdom без реального 2d-контекста
      ctx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/webp;base64,AAAA",
    );

    const frame = document.createElement("div");
    Object.defineProperty(frame, "offsetWidth", { configurable: true, get: () => 400 });
    Object.defineProperty(frame, "offsetHeight", { configurable: true, get: () => 600 });
    frame.style.setProperty("--panel", "#1a1a1a");
    frame.style.setProperty("--text", "#f2f2f2");
    frame.style.setProperty("--border", "#ccc");

    const record = bakePanelPlate(frame, 16, 0.5);
    expect(record).not.toBeNull();
    expect(record?.url.startsWith("data:image/webp")).toBe(true);
    expect(record?.width).toBe(200);
    expect(record?.height).toBe(300);
    expect(record!.bytes).toBeLessThan(200 * 300 * 4);
    expect(estimateBakeCacheBytes()).toBe(0);
  });
});
