import { afterEach, describe, expect, it, vi } from "vitest";

import { copyText } from "./copyText";

describe("copyText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(copyText("hello@example.com")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello@example.com");
  });
});
