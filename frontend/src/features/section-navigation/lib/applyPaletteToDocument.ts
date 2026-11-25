import type { SectionPalette } from "@/shared/content/sectionPalettes";

export function applyPaletteToDocument(palette: SectionPalette, sectionId: string): void {
  const root = document.documentElement;
  root.style.setProperty("--stage-bg", palette.bg);
  root.style.setProperty("--stage-fg", palette.fg);
  root.style.setProperty("--bg", palette.bg);
  root.style.setProperty("--text", palette.fg);
  root.style.setProperty("--panel", palette.panel);
  root.style.setProperty("--panel-alt", palette.panel);
  root.style.setProperty("--border", palette.border);
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent-ink", palette.accentInk);
  root.style.setProperty("--muted", palette.muted);
  document.body.style.backgroundColor = palette.bg;
  document.body.style.color = palette.fg;
  document.body.setAttribute("data-section", sectionId);
}
