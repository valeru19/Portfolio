import { describe, expect, it } from "vitest";

import { panelRoleFor, panelViewFor, roleFromView, viewFromRole } from "./panelView";

describe("panelViewFor / panelRoleFor (step 17 active|next|flat)", () => {
  const n = 7;

  it("maps roles: active→sharp, next→blur, flat→solid", () => {
    expect(viewFromRole("active")).toBe("sharp");
    expect(viewFromRole("next")).toBe("blur");
    expect(viewFromRole("flat")).toBe("solid");
    expect(roleFromView("sharp")).toBe("active");
    expect(roleFromView("blur")).toBe("next");
    expect(roleFromView("solid")).toBe("flat");
  });

  it("marks active as sharp and next as blur", () => {
    expect(panelViewFor(0, 0, n)).toBe("sharp");
    expect(panelRoleFor(0, 0, n)).toBe("active");
    expect(panelViewFor(1, 0, n)).toBe("blur");
    expect(panelRoleFor(1, 0, n)).toBe("next");
    expect(panelViewFor(2, 0, n)).toBe("solid");
    expect(panelRoleFor(2, 0, n)).toBe("flat");
    expect(panelViewFor(6, 0, n)).toBe("solid");
  });

  it("marks previous neighbor as flat (not blur)", () => {
    expect(panelRoleFor(2, 3, n)).toBe("flat");
    expect(panelRoleFor(3, 3, n)).toBe("active");
    expect(panelRoleFor(4, 3, n)).toBe("next");
  });

  it("has no next/blur panel on the last section", () => {
    expect(panelRoleFor(6, 6, n)).toBe("active");
    expect(panelRoleFor(5, 6, n)).toBe("flat");
    expect(panelRoleFor(0, 6, n)).toBe("flat");
  });

  it("never returns more than one next/blur for a given active index", () => {
    for (let active = 0; active < n; active += 1) {
      const views = Array.from({ length: n }, (_, i) => panelViewFor(i, active, n));
      expect(views.filter((v) => v === "blur")).toHaveLength(active === n - 1 ? 0 : 1);
      expect(views.filter((v) => v === "sharp")).toHaveLength(1);
    }
  });
});
