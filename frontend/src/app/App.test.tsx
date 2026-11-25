import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { content } from "@/shared/content";
import { I18nProvider } from "@/shared/i18n";

import { App } from "./App";
import { ThemeProvider } from "./providers";

describe("App", () => {
  it("renders content through providers", () => {
    render(
      <ThemeProvider initialTheme="dark">
        <I18nProvider initialLang="ru">
          <App />
        </I18nProvider>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", { name: content.meta.name.ru }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("project-count")).toHaveTextContent(
      String(content.projects.items.length),
    );
    expect(screen.getByTestId("lang")).toHaveTextContent("ru");
  });
});
