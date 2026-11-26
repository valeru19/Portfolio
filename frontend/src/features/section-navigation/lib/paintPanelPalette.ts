import type { SectionId } from "@/shared/content";
import { sectionPaletteForId, type SectionPalette } from "@/shared/content/sectionPalettes";
import type { Theme } from "@/shared/theme";

function setVar(el: HTMLElement, name: string, value: string): void {
  if (el.style.getPropertyValue(name) !== value) {
    el.style.setProperty(name, value);
  }
}

/**
 * Цвета поверхности панели через CSS-переменные (не inline background).
 * Полный набор токенов (включая --stage-*), чтобы кнопки/текст на чужих
 * секциях не перекрашивались при смене document-палитры на flip.
 */
export function paintPanelPalette(section: HTMLElement, palette: SectionPalette): void {
  if (section.style.backgroundColor) section.style.backgroundColor = "";
  if (section.style.borderColor) section.style.borderColor = "";
  if (section.style.color) section.style.color = "";

  setVar(section, "--panel", palette.panel);
  setVar(section, "--panel-alt", palette.panel);
  setVar(section, "--text", palette.fg);
  setVar(section, "--border", palette.border);
  setVar(section, "--accent", palette.accent);
  setVar(section, "--accent-ink", palette.accentInk);
  setVar(section, "--muted", palette.muted);
  // Кнопки/hover раньше читали stage-* с :root — из‑за этого чужие секции
  // перекрашивались при applyPaletteToDocument.
  setVar(section, "--stage-fg", palette.fg);
  setVar(section, "--stage-bg", palette.bg);
  setVar(section, "--bg", palette.bg);
}

export function paintPanelPaletteForId(
  section: HTMLElement,
  theme: Theme,
  sectionId: SectionId,
): void {
  paintPanelPalette(section, sectionPaletteForId(theme, sectionId));
}
