import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STORAGE_THEME } from "@/shared/config/storageKeys";

import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./useTheme";

function Probe() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <p data-testid="theme">{theme}</p>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        set-light
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
    document.documentElement.removeAttribute("data-theme");
  });

  it("persists theme to localStorage and data-theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider initialTheme="dark">
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(STORAGE_THEME)).toBe("light");
  });

  it("still toggles theme when localStorage is unavailable", async () => {
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

    const user = userEvent.setup();
    render(
      <ThemeProvider initialTheme="dark">
        <Probe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "set-light" }));
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
