import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpiralNavigationProvider } from "@/features/section-navigation";
import { contactsConfig } from "@/shared/config";
import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

import { Contacts } from "./Contacts";

describe("Contacts widget", () => {
  it("renders six visible contact links and the copy-email control", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <I18nProvider initialLang="en">
          <SpiralNavigationProvider sectionIds={["contacts"]}>
            <Contacts />
          </SpiralNavigationProvider>
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(screen.getByRole("link", { name: /Email/i })).toHaveAttribute(
      "href",
      contactsConfig.email.href,
    );
    expect(screen.getByRole("link", { name: /Telegram/i })).toHaveAttribute(
      "href",
      contactsConfig.telegram.href,
    );
    expect(screen.getByRole("link", { name: /GitHub/i })).toHaveAttribute(
      "href",
      contactsConfig.github.href,
    );
    expect(screen.getByRole("link", { name: /hh\.ru/i })).toHaveAttribute(
      "href",
      contactsConfig.hh.href,
    );
    expect(screen.getByRole("link", { name: /LinkedIn/i })).toHaveAttribute(
      "href",
      contactsConfig.linkedin.href,
    );
    const vk = screen.getByRole("link", { name: /^VK/i });
    expect(vk).toHaveAttribute("href", contactsConfig.vk.href);
    expect(vk).toHaveAttribute("rel", "noopener noreferrer");
    expect(vk).toHaveAttribute("target", "_blank");

    expect(screen.getByRole("button", { name: content.contacts.copy.en })).toBeInTheDocument();
  });
});
