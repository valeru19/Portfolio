import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { I18nProvider } from "@/shared/i18n";

import { Footer } from "./Footer";

describe("Footer privacy", () => {
  it("does not show the email sentence while email is TODO", () => {
    render(
      <I18nProvider initialLang="en">
        <Footer />
      </I18nProvider>,
    );

    expect(screen.getByRole("heading", { name: /Personal data processing/i })).toBeInTheDocument();
    expect(screen.queryByText(/write to/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TODO/i)).not.toBeInTheDocument();
  });
});
