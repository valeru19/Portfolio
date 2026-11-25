import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

import { App } from "./App";
import { QueryProvider } from "./providers";

function renderApp() {
  return render(
    <ThemeProvider initialTheme="dark">
      <I18nProvider initialLang="en">
        <QueryProvider>
          <App />
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>,
  );
}

describe("App API section visibility", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hides Reviews and Apply when VITE_API_BASE is empty", () => {
    vi.stubEnv("VITE_API_BASE", "");
    renderApp();

    expect(
      screen.queryByRole("heading", { name: content.reviews.title.en }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: content.apply.title.en })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: content.nav.reviews.en })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: content.nav.apply.en })).not.toBeInTheDocument();
  });

  it("shows Reviews and Apply when VITE_API_BASE is set", () => {
    vi.stubEnv("VITE_API_BASE", "http://127.0.0.1:8000");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      }),
    );
    renderApp();

    expect(screen.getByRole("heading", { name: content.reviews.title.en })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: content.apply.title.en })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: content.nav.reviews.en })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: content.nav.apply.en })).toBeInTheDocument();
  });
});
