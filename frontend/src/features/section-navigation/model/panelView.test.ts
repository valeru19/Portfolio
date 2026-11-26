import { describe, expect, it } from "vitest";

import { panelViewFor } from "./panelView";

describe("panelViewFor", () => {
  const n = 7;

  it("marks active as sharp and next as blur", () => {
    expect(panelViewFor(0, 0, n)).toBe("sharp");
    expect(panelViewFor(1, 0, n)).toBe("blur");
    expect(panelViewFor(2, 0, n)).toBe("solid");
    expect(panelViewFor(6, 0, n)).toBe("solid");
  });

  it("marks previous neighbor as solid (not blur)", () => {
    expect(panelViewFor(2, 3, n)).toBe("solid");
    expect(panelViewFor(3, 3, n)).toBe("sharp");
    expect(panelViewFor(4, 3, n)).toBe("blur");
  });

  it("on last section marks first as ring blur", () => {
    expect(panelViewFor(6, 6, n)).toBe("sharp");
    expect(panelViewFor(5, 6, n)).toBe("solid");
    expect(panelViewFor(0, 6, n)).toBe("blur");
  });

  it("never returns more than one blur for a given active index", () => {
    for (let active = 0; active < n; active += 1) {
      const views = Array.from({ length: n }, (_, i) => panelViewFor(i, active, n));
      expect(views.filter((v) => v === "blur")).toHaveLength(1);
      expect(views.filter((v) => v === "sharp")).toHaveLength(1);
    }
  });
});
