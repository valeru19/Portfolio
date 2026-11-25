import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_MODE } from "@/shared/config";
import { safeGetItem, safeRemoveItem } from "@/shared/lib";

import { useAccessibleMode } from "./useAccessibleMode";

describe("useAccessibleMode", () => {
  beforeEach(() => {
    safeRemoveItem(STORAGE_MODE);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    safeRemoveItem(STORAGE_MODE);
    document.documentElement.classList.remove("is-accessible");
    document.body.classList.remove("is-accessible");
  });

  it("starts in spiral mode when storage is empty and motion is allowed", () => {
    const { result } = renderHook(() => useAccessibleMode());
    expect(result.current.isAccessible).toBe(false);
  });

  it("starts accessible when prefers-reduced-motion matches", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useAccessibleMode());
    expect(result.current.isAccessible).toBe(true);
  });

  it("persists toggle to localStorage", () => {
    const { result } = renderHook(() => useAccessibleMode());
    act(() => {
      result.current.toggleAccessible();
    });
    expect(result.current.isAccessible).toBe(true);
    expect(safeGetItem(STORAGE_MODE)).toBe("accessible");
    act(() => {
      result.current.toggleAccessible();
    });
    expect(safeGetItem(STORAGE_MODE)).toBe("spiral");
  });
});
