import { describe, expect, it } from "vitest";

import {
  LINKEDIN_PROFILE_SLUG,
  contactsConfig,
  hhResumeHref,
  linkedInProfileHref,
  sameAsUrls,
  visibleContacts,
} from "./contacts";

describe("contactsConfig", () => {
  it("exposes five visible contacts without VK or phone", () => {
    const links = visibleContacts();
    expect(links.map((link) => link.id)).toEqual([
      "email",
      "telegram",
      "github",
      "hh",
      "linkedin",
    ]);
    expect(links.some((link) => link.id === "vk")).toBe(false);
    expect(JSON.stringify(contactsConfig).toLowerCase()).not.toContain("tel:");
  });

  it("builds a valid LinkedIn href with encoded Cyrillic slug", () => {
    const href = linkedInProfileHref();
    expect(href).toBe(contactsConfig.linkedin.href);
    expect(href).toContain("https://www.linkedin.com/in/");
    expect(href).not.toContain(LINKEDIN_PROFILE_SLUG);
    expect(() => new URL(href)).not.toThrow();
    expect(decodeURI(href)).toContain(LINKEDIN_PROFILE_SLUG);
    expect(contactsConfig.linkedin.value).toContain(LINKEDIN_PROFILE_SLUG);
  });

  it("keeps mailto out of JSON-LD sameAs and includes https contacts", () => {
    const urls = sameAsUrls();
    expect(urls.some((url) => url.startsWith("mailto:"))).toBe(false);
    expect(urls).toEqual([
      contactsConfig.telegram.href,
      contactsConfig.github.href,
      contactsConfig.hh.href,
      contactsConfig.linkedin.href,
    ]);
  });

  it("uses the exact contact hrefs provided for the site", () => {
    expect(contactsConfig.email.href).toBe("mailto:wal.era.kozhin01@gmail.com");
    expect(contactsConfig.email.value).toBe("wal.era.kozhin01@gmail.com");
    expect(contactsConfig.telegram.href).toBe("https://t.me/comfortable_kitten");
    expect(contactsConfig.github.href).toBe("https://github.com/valeru19");
    expect(contactsConfig.hh.href).toBe(
      "https://spb.hh.ru/resume/ee683c75ff10f7d8690039ed1f4b5679303742",
    );
    expect(hhResumeHref()).toBe(contactsConfig.hh.href);
  });
});
