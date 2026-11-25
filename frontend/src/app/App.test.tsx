import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders scaffold stub", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Valeru Portfolio" })).toBeInTheDocument();
  });
});
