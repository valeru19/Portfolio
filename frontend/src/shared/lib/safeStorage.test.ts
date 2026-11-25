import { afterEach, describe, expect, it, vi } from "vitest";

import { safeGetItem, safeRemoveItem, safeSetItem } from "./safeStorage";

describe("safeStorage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it("reads and writes when localStorage works", () => {
    expect(safeSetItem("k", "v")).toBe(true);
    expect(safeGetItem("k")).toBe("v");
    expect(safeRemoveItem("k")).toBe(true);
    expect(safeGetItem("k")).toBeNull();
  });

  it("returns null / false when localStorage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });

    expect(safeGetItem("k")).toBeNull();
    expect(safeSetItem("k", "v")).toBe(false);
    expect(safeRemoveItem("k")).toBe(false);
  });
});
