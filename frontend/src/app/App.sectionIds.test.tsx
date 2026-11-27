import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider, useI18n } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

const sectionIdsSeen: unknown[] = [];

vi.mock("@/features/section-navigation", async () => {
  const actual = await vi.importActual<typeof import("@/features/section-navigation")>(
    "@/features/section-navigation",
  );
  function CaptureProvider({
    sectionIds,
    children,
  }: {
    sectionIds: readonly string[];
    children: React.ReactNode;
  }) {
    sectionIdsSeen.push(sectionIds);
    return (
      <actual.SpiralNavigationProvider sectionIds={sectionIds as never}>
        {children}
      </actual.SpiralNavigationProvider>
    );
  }
  return {
    ...actual,
    SpiralNavigationProvider: CaptureProvider,
  };
});

import { App } from "./App";

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button type="button" onClick={() => setLang(lang === "ru" ? "en" : "ru")}>
      toggle-lang
    </button>
  );
}

describe("App sectionIds identity", () => {
  it("keeps the same sectionIds array reference across language toggles", async () => {
    sectionIdsSeen.length = 0;
    render(
      <ThemeProvider initialTheme="dark">
        <I18nProvider initialLang="ru">
          <LangToggle />
          <App />
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(sectionIdsSeen.length).toBeGreaterThanOrEqual(1);
    const first = sectionIdsSeen[0];

    await act(async () => {
      screen.getByRole("button", { name: "toggle-lang" }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: "toggle-lang" }).click();
    });

    expect(sectionIdsSeen.length).toBeGreaterThan(1);
    for (const ids of sectionIdsSeen) {
      expect(ids).toBe(first);
    }
  });
});
