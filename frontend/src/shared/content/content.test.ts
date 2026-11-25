import { describe, expect, it } from "vitest";

import { visibleContacts } from "@/shared/config/contacts";

import { content } from "./index";
import { pendingStackItems } from "./stack.pending";

describe("content", () => {
  it("derives about project stat from projects.items.length", () => {
    const projectsStat = content.about.stats.find((s) => s.id === "projects");
    expect(projectsStat?.value).toBe(String(content.projects.items.length));
    expect(content.projects.items.length).toBeGreaterThanOrEqual(6);
  });

  it("keeps pending techs out of rendered stack groups", () => {
    const pendingIds = new Set(pendingStackItems.map((p) => p.id));
    const logos = content.stack.groups.flatMap((g) => g.items.map((i) => i.logo).filter(Boolean));
    for (const id of pendingIds) {
      expect(logos).not.toContain(id);
    }
  });

  it("exposes all configured visible contacts", () => {
    const links = visibleContacts();
    expect(links.map((link) => link.id)).toEqual([
      "email",
      "telegram",
      "github",
      "hh",
      "linkedin",
      "vk",
    ]);
  });

  it("includes Portfolio project with code URL", () => {
    const portfolio = content.projects.items.find((p) =>
      typeof p.name === "string" ? false : p.name.en === "Portfolio",
    );
    expect(portfolio?.code).toBe("https://github.com/valeru19/Portfolio");
    expect(portfolio?.demo).toBe("");
  });
});
