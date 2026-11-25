import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { contactsConfig } from "@/shared/config/contacts";
import { I18nProvider } from "@/shared/i18n";

import { Footer } from "./Footer";

type MutableContact = {
  value: string;
  href: string;
  hidden?: boolean;
};

type Snapshot = { value: string; href: string; hidden?: boolean };

describe("Footer privacy", () => {
  const email = contactsConfig.email as MutableContact;
  const telegram = contactsConfig.telegram as MutableContact;
  const linkedin = contactsConfig.linkedin as MutableContact;

  let emailSnapshot: Snapshot;
  let telegramSnapshot: Snapshot;
  let linkedinSnapshot: Snapshot;

  beforeEach(() => {
    emailSnapshot = { value: email.value, href: email.href, hidden: email.hidden };
    telegramSnapshot = { value: telegram.value, href: telegram.href, hidden: telegram.hidden };
    linkedinSnapshot = { value: linkedin.value, href: linkedin.href, hidden: linkedin.hidden };
  });

  afterEach(() => {
    Object.assign(email, emailSnapshot);
    Object.assign(telegram, telegramSnapshot);
    Object.assign(linkedin, linkedinSnapshot);
  });

  it("shows the deletion line with the email contact by default", () => {
    render(
      <I18nProvider initialLang="en">
        <Footer />
      </I18nProvider>,
    );

    expect(screen.getByText(new RegExp(`write to ${email.value}`, "i"))).toBeInTheDocument();
  });

  it("hides the contact sentence when privacy channels are unavailable", () => {
    email.hidden = true;
    telegram.hidden = true;
    linkedin.hidden = true;

    render(
      <I18nProvider initialLang="en">
        <Footer />
      </I18nProvider>,
    );

    expect(screen.getByRole("heading", { name: /Personal data processing/i })).toBeInTheDocument();
    expect(screen.queryByText(/write to/i)).not.toBeInTheDocument();
  });
});
