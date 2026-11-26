import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { contactsConfig, hasPrivacyContactChannel, privacyContactForDeletion } from "./contacts";

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
    email.hidden = true;
    telegram.hidden = true;
    linkedin.hidden = true;
    expect(privacyContactForDeletion()).toBeNull();
    expect(hasPrivacyContactChannel()).toBe(false);
  });

  it("prefers email, then telegram, then linkedin", () => {
    email.hidden = true;
    telegram.hidden = true;
    linkedin.hidden = false;
    expect(privacyContactForDeletion()?.id).toBe("linkedin");

    telegram.hidden = false;
    expect(privacyContactForDeletion()?.id).toBe("telegram");

    email.hidden = false;
    expect(privacyContactForDeletion()?.id).toBe("email");
    expect(hasPrivacyContactChannel()).toBe(true);
  });
});
