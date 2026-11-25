import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  contactsConfig,
  hasPrivacyContactChannel,
  privacyContactForDeletion,
} from "./contacts";

type MutableContact = {
  value: string;
  href: string;
  hidden?: boolean;
};

type ContactSnapshot = {
  value: string;
  href: string;
  hidden?: boolean;
};

function snapshotContact(contact: MutableContact): ContactSnapshot {
  return { value: contact.value, href: contact.href, hidden: contact.hidden };
}

function restoreContact(contact: MutableContact, snapshot: ContactSnapshot) {
  contact.value = snapshot.value;
  contact.href = snapshot.href;
  contact.hidden = snapshot.hidden;
}

describe("privacy contact channel", () => {
  const email = contactsConfig.email as MutableContact;
  const telegram = contactsConfig.telegram as MutableContact;
  const linkedin = contactsConfig.linkedin as MutableContact;

  let emailSnapshot: ContactSnapshot;
  let telegramSnapshot: ContactSnapshot;
  let linkedinSnapshot: ContactSnapshot;

  beforeEach(() => {
    emailSnapshot = snapshotContact(email);
    telegramSnapshot = snapshotContact(telegram);
    linkedinSnapshot = snapshotContact(linkedin);
  });

  afterEach(() => {
    restoreContact(email, emailSnapshot);
    restoreContact(telegram, telegramSnapshot);
    restoreContact(linkedin, linkedinSnapshot);
  });

  it("returns null when email, telegram and linkedin are hidden", () => {
    expect(privacyContactForDeletion()).toBeNull();
    expect(hasPrivacyContactChannel()).toBe(false);
  });

  it("prefers email, then telegram, then linkedin", () => {
    linkedin.value = "linkedin.com/in/valeru";
    linkedin.href = "https://linkedin.com/in/valeru";
    linkedin.hidden = false;
    expect(privacyContactForDeletion()?.id).toBe("linkedin");

    telegram.value = "@valeru";
    telegram.href = "https://t.me/valeru";
    telegram.hidden = false;
    expect(privacyContactForDeletion()?.id).toBe("telegram");

    email.value = "me@example.com";
    email.href = "mailto:me@example.com";
    email.hidden = false;
    expect(privacyContactForDeletion()?.id).toBe("email");
    expect(hasPrivacyContactChannel()).toBe(true);
  });
});
