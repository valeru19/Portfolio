import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpiralNavigationProvider } from "@/features/section-navigation";
import { contactsConfig } from "@/shared/config";
import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

import { Contacts } from "./Contacts";

describe("Contacts widget", () => {
  it("does not render hidden/TODO contacts in the DOM as links", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <I18nProvider initialLang="en">
          <SpiralNavigationProvider sectionIds={["contacts"]}>
            <Contacts />
          </SpiralNavigationProvider>
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(screen.getByRole("link", { name: /GitHub/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Email/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Telegram/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /LinkedIn/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /hh\.ru/i })).not.toBeInTheDocument();

    for (const link of Object.values(contactsConfig)) {
      const isHidden = "hidden" in link && link.hidden === true;
      if (isHidden || link.href === "TODO") {
        expect(screen.queryByText(link.value)).not.toBeInTheDocument();
      }
    }
  });
});
