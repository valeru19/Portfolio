import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { contactsConfig } from "@/shared/config/contacts";
import { I18nProvider } from "@/shared/i18n";

import { Footer } from "./Footer";

type MutableContact = {
  value: string;
  href: string;
  hidden?: boolean;
};

describe("Footer privacy", () => {
  const email = contactsConfig.email as MutableContact;
  let snapshot: { value: string; href: string; hidden?: boolean };

  afterEach(() => {
    email.value = snapshot.value;
    email.href = snapshot.href;
    email.hidden = snapshot.hidden;
  });

  it("does not show the contact sentence while privacy channels are TODO", () => {
    snapshot = { value: email.value, href: email.href, hidden: email.hidden };

    render(
      <I18nProvider initialLang="en">
        <Footer />
      </I18nProvider>,
    );

    expect(screen.getByRole("heading", { name: /Personal data processing/i })).toBeInTheDocument();
    expect(screen.queryByText(/write to/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/TODO/i)).not.toBeInTheDocument();
  });

  it("shows the deletion line with the first privacy contact value", () => {
    snapshot = { value: email.value, href: email.href, hidden: email.hidden };
    email.value = "privacy@example.com";
    email.href = "mailto:privacy@example.com";
    email.hidden = false;

    render(
      <I18nProvider initialLang="en">
        <Footer />
      </I18nProvider>,
    );

    expect(screen.getByText(/write to privacy@example.com/i)).toBeInTheDocument();
  });
});
