import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

import { App } from "./App";

describe("App", () => {
  it("renders static sections from content", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <I18nProvider initialLang="ru">
          <App />
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: content.meta.name.ru }),
    ).toBeInTheDocument();
    // about = blur (в a11y); дальние solid — content-visibility:hidden, ищем в DOM.
    expect(screen.getByRole("heading", { name: content.about.title.ru })).toBeInTheDocument();
    expect(document.querySelector("#stack")).toBeTruthy();
    expect(document.querySelector("#contacts")).toBeTruthy();
    expect(screen.getByRole("link", { name: content.a11y.skipToContent.ru })).toHaveAttribute(
      "href",
      "#main",
    );
  });
});
