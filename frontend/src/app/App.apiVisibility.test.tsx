import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

import { App } from "./App";
import { QueryProvider } from "./providers";

vi.mock("@/shared/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/config")>();
  return {
    ...actual,
    isApiConfigured: vi.fn(() => false),
    hasPrivacyContactChannel: vi.fn(() => false),
  };
});

import { hasPrivacyContactChannel, isApiConfigured } from "@/shared/config";

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
    vi.mocked(isApiConfigured).mockReset();
    vi.mocked(hasPrivacyContactChannel).mockReset();
    vi.unstubAllEnvs();
  });

  it("hides Reviews and Apply when VITE_API_BASE is empty", () => {
    vi.mocked(isApiConfigured).mockReturnValue(false);
    vi.mocked(hasPrivacyContactChannel).mockReturnValue(true);
    renderApp();

    expect(
      screen.queryByRole("heading", { name: content.reviews.title.en }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: content.apply.title.en })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: content.nav.reviews.en })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: content.nav.apply.en })).not.toBeInTheDocument();
  });

  it("hides Reviews and Apply when API is set but privacy contact channel is missing", () => {
    vi.mocked(isApiConfigured).mockReturnValue(true);
    vi.mocked(hasPrivacyContactChannel).mockReturnValue(false);
    renderApp();

    expect(
      screen.queryByRole("heading", { name: content.reviews.title.en }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: content.apply.title.en })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: content.nav.reviews.en })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: content.nav.apply.en })).not.toBeInTheDocument();
  });

  it("shows Reviews and Apply when API and privacy contact channel are available", () => {
    vi.mocked(isApiConfigured).mockReturnValue(true);
    vi.mocked(hasPrivacyContactChannel).mockReturnValue(true);
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
