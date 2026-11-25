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
  it("exposes six visible contacts including VK and email", () => {
    const links = visibleContacts();
    expect(links.map((link) => link.id)).toEqual([
      "email",
      "telegram",
      "github",
      "hh",
      "linkedin",
      "vk",
    ]);
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
    expect(urls).toContain(contactsConfig.github.href);
    expect(urls).toContain(contactsConfig.telegram.href);
    expect(urls).toContain(contactsConfig.hh.href);
    expect(urls).toContain(contactsConfig.linkedin.href);
    expect(urls).toContain(contactsConfig.vk.href);
    expect(urls).toHaveLength(5);
  });

  it("exposes the hh.ru resume URL for the hero CTA", () => {
    expect(hhResumeHref()).toBe(contactsConfig.hh.href);
  });
});
