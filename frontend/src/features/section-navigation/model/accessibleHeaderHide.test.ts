import { describe, expect, it } from "vitest";

import { nextAccessibleHeaderHidden } from "./accessibleHeaderHide";

describe("nextAccessibleHeaderHidden", () => {
  it("shows header near the top", () => {
    expect(
      nextAccessibleHeaderHidden({
        scrollY: 8,
        deltaY: 20,
        isFocusInsideHeader: false,
        currentlyHidden: true,
      }),
    ).toBe(false);
  });

  it("hides on downward scroll past threshold", () => {
    expect(
      nextAccessibleHeaderHidden({
        scrollY: 80,
        deltaY: 10,
        isFocusInsideHeader: false,
        currentlyHidden: false,
      }),
    ).toBe(true);
  });

  it("shows again on upward scroll", () => {
    expect(
      nextAccessibleHeaderHidden({
        scrollY: 120,
        deltaY: -2,
        isFocusInsideHeader: false,
        currentlyHidden: true,
      }),
    ).toBe(false);
  });

  it("never hides while focus is inside the header", () => {
    expect(
      nextAccessibleHeaderHidden({
        scrollY: 200,
        deltaY: 30,
        isFocusInsideHeader: true,
        currentlyHidden: false,
      }),
    ).toBe(false);
  });
});
