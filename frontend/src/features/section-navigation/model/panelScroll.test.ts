import { describe, expect, it } from "vitest";

import { nextScrollTopAfterWheel, panelAtScrollEdge, panelCanConsumeWheel } from "./panelScroll";

describe("panelScroll", () => {
  const tall = {
    scrollTop: 0,
    scrollHeight: 1200,
    clientHeight: 600,
    hasScrollableAttr: true,
  };

  it("consumes wheel only when data-scrollable is set and content overflows", () => {
    expect(panelCanConsumeWheel(tall)).toBe(true);
    expect(panelCanConsumeWheel({ ...tall, hasScrollableAttr: false })).toBe(false);
    expect(panelCanConsumeWheel({ ...tall, scrollHeight: 601 })).toBe(false);
  });

  it("detects top and bottom edges", () => {
    expect(panelAtScrollEdge(tall, 10)).toBe(false);
    expect(panelAtScrollEdge({ ...tall, scrollTop: 600 }, 10)).toBe(true);
    expect(panelAtScrollEdge(tall, -10)).toBe(true);
  });

  it("advances scrollTop by wheel delta and clamps to bounds", () => {
    expect(nextScrollTopAfterWheel(tall, 120)).toBe(120);
    expect(nextScrollTopAfterWheel({ ...tall, scrollTop: 550 }, 120)).toBe(600);
    expect(nextScrollTopAfterWheel({ ...tall, scrollTop: 40 }, -80)).toBe(0);
  });
});
