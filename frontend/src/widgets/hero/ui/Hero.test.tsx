import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpiralNavigationProvider } from "@/features/section-navigation";
import { contactsConfig } from "@/shared/config";
import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

import { Hero } from "./Hero";

describe("Hero", () => {
  it("shows the hh.ru resume button with the configured href", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <I18nProvider initialLang="en">
          <SpiralNavigationProvider sectionIds={["hero", "contacts"]}>
            <Hero />
          </SpiralNavigationProvider>
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(screen.getByRole("link", { name: content.hero.ctaResume.en })).toHaveAttribute(
      "href",
      contactsConfig.hh.href,
    );
  });
});
