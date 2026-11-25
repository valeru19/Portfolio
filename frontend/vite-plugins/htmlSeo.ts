import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

import { sameAsUrls } from "../src/shared/config/contacts";
import { meta } from "../src/shared/content/meta";

const OG_IMAGE_CANDIDATES = ["og-image.png", "og-image.jpg", "og-image.webp"] as const;

export function normalizeSiteUrl(raw: string): string {
  return raw.replace(/\/$/, "");
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function findOgImage(publicDir: string, siteUrl: string): string | null {
  for (const fileName of OG_IMAGE_CANDIDATES) {
    if (fs.existsSync(path.join(publicDir, fileName))) {
      return `${siteUrl}/${fileName}`;
    }
  }
  return null;
}

/** Builds the SEO head fragment injected into dist/index.html at build time. */
export function buildHeadTags(siteUrl: string, ogImageUrl: string | null): string {
  const title = meta.title.ru;
  const description = meta.description.ru;
  const ogDescription = meta.ogDescription.ru;
  const canonical = siteUrl ? `${siteUrl}/` : "";
  const sameAs = sameAsUrls();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: meta.name.ru,
    jobTitle: meta.role.ru,
    url: canonical || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  const lines = [
    `<title>${escapeHtmlAttribute(title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttribute(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtmlAttribute(title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttribute(ogDescription)}" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:locale:alternate" content="en_US" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttribute(ogDescription)}" />`,
  ];

  if (canonical) {
    lines.push(`<link rel="canonical" href="${escapeHtmlAttribute(canonical)}" />`);
    lines.push(`<meta property="og:url" content="${escapeHtmlAttribute(canonical)}" />`);
  }

  if (ogImageUrl) {
    lines.push(
      `<meta property="og:image" content="${escapeHtmlAttribute(ogImageUrl)}" />`,
    );
  }

  lines.push(
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  );

  return lines.join("\n    ");
}

/**
 * Injects SEO meta/JSON-LD into the built index.html without requiring client JS.
 */
export function htmlSeoPlugin(rootDir: string): Plugin {
  return {
    name: "html-seo",
    transformIndexHtml(html) {
      const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL || "");
      const publicDir = path.join(rootDir, "public");
      const ogImageUrl = siteUrl ? findOgImage(publicDir, siteUrl) : null;
      const tags = buildHeadTags(siteUrl, ogImageUrl);

      // Replace the static title placeholder with the full SEO block.
      return html.replace(/<title>[\s\S]*?<\/title>/, tags);
    },
  };
}
