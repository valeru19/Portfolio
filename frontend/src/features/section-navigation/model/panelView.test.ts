import { describe, expect, it } from "vitest";

import { panelViewFor } from "./panelView";

describe("panelViewFor", () => {
  it("assigns sharp / blur / solid around the active index", () => {
    const n = 7;
    expect(panelViewFor(0, 0, n)).toBe("sharp");
    expect(panelViewFor(1, 0, n)).toBe("blur");
    expect(panelViewFor(2, 0, n)).toBe("solid");
    expect(panelViewFor(6, 0, n)).toBe("solid");
  });

  it("has no blur after the last section", () => {
    const n = 7;
    expect(panelViewFor(6, 6, n)).toBe("sharp");
    expect(panelViewFor(5, 6, n)).toBe("solid");
    expect(panelViewFor(0, 6, n)).toBe("solid");
  });

  it("keeps at most one blur view", () => {
    const n = 7;
    for (let active = 0; active < n; active += 1) {
      const views = Array.from({ length: n }, (_, i) => panelViewFor(i, active, n));
      expect(views.filter((v) => v === "blur").length).toBe(active < n - 1 ? 1 : 0);
      expect(views.filter((v) => v === "sharp").length).toBe(1);
    }
  });
});
