import type { SectionId } from "@/shared/content";
import { sectionPaletteForId, type SectionPalette } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

/** Per-panel surface colors (legacy ensureSectionPalettes) — stable while the stage palette changes. */
export function paintPanelPalette(section: HTMLElement, palette: SectionPalette): void {
  section.style.backgroundColor = palette.panel;
  section.style.color = palette.fg;
  section.style.borderColor = palette.border;
  // Scope tokens to the panel so children (e.g. contact chips) don't pick up a
  // mismatched document --text/--panel from another section or theme flash.
  section.style.setProperty("--panel", palette.panel);
  section.style.setProperty("--panel-alt", palette.panel);
  section.style.setProperty("--text", palette.fg);
  section.style.setProperty("--border", palette.border);
  section.style.setProperty("--accent", palette.accent);
  section.style.setProperty("--accent-ink", palette.accentInk);
  section.style.setProperty("--muted", palette.muted);
}
export function paintPanelPaletteForId(
  section: HTMLElement,
  theme: Theme,
  sectionId: SectionId,
): void {
  paintPanelPalette(section, sectionPaletteForId(theme, sectionId));
}
