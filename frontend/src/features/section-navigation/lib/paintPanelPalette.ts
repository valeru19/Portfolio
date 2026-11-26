import type { SectionId } from "@/shared/content";
import { sectionPaletteForId, type SectionPalette } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

/**
 * Цвета поверхности конкретной панели (аналог legacy ensureSectionPalettes).
 * Остаются стабильными, пока stage-палитра документа меняется при перевороте.
 */
export function paintPanelPalette(section: HTMLElement, palette: SectionPalette): void {
  section.style.backgroundColor = palette.panel;
  section.style.color = palette.fg;
  section.style.borderColor = palette.border;
  // Токены на панели, чтобы дети (чипы контактов и т.п.) не подхватывали
  // чужие document --text/--panel от другой секции или вспышки темы.
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
