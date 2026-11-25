import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { contactsConfig } from "../src/shared/config/contacts";
import { meta } from "../src/shared/content/meta";

import { buildHeadTags, findOgImage, normalizeSiteUrl } from "./htmlSeo";

describe("htmlSeo plugin helpers", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("injects twitter and open graph tags from the same meta source", () => {
    const html = buildHeadTags("https://valeru19.github.io/Portfolio", null);

    expect(html).toContain('name="twitter:card" content="summary"');
    expect(html).toContain(
      `name="twitter:title" content="${meta.title.ru.replaceAll('"', "&quot;")}"`,
    );
    expect(html).toContain(
      `name="twitter:description" content="${meta.ogDescription.ru.replaceAll('"', "&quot;")}"`,
    );
    expect(html).toContain(`property="og:title" content="${meta.title.ru.replaceAll('"', "&quot;")}"`);
    expect(html).toContain(
      `property="og:description" content="${meta.ogDescription.ru.replaceAll('"', "&quot;")}"`,
    );
    expect(html).toContain('rel="canonical" href="https://valeru19.github.io/Portfolio/"');
    expect(html).not.toContain("og:image");
  });

  it("adds og:image only when the file exists in public/", () => {
    const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-public-"));
    tempDirs.push(publicDir);
    const siteUrl = "https://example.com";

    expect(findOgImage(publicDir, siteUrl)).toBeNull();

    fs.writeFileSync(path.join(publicDir, "og-image.png"), "");
    expect(findOgImage(publicDir, siteUrl)).toBe(`${siteUrl}/og-image.png`);

    const withImage = buildHeadTags(siteUrl, `${siteUrl}/og-image.png`);
    expect(withImage).toContain(`property="og:image" content="${siteUrl}/og-image.png"`);
  });

  it("normalizes trailing slash on site URL", () => {
    expect(normalizeSiteUrl("https://example.com/")).toBe("https://example.com");
  });

  it("puts only https contacts into JSON-LD sameAs (no mailto)", () => {
    const html = buildHeadTags("https://valeru19.github.io/Portfolio", null);
    const match = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    expect(match).not.toBeNull();
    const jsonLd = JSON.parse(match?.[1] ?? "{}") as { sameAs?: string[] };
    expect(jsonLd.sameAs).toEqual(
      expect.arrayContaining([
        contactsConfig.github.href,
        contactsConfig.telegram.href,
        contactsConfig.hh.href,
        contactsConfig.linkedin.href,
        contactsConfig.vk.href,
      ]),
    );
    expect(jsonLd.sameAs).toHaveLength(5);
    expect(jsonLd.sameAs?.some((url) => url.startsWith("mailto:"))).toBe(false);
  });
});
