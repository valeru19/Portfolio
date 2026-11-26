import type { SectionPalette } from "@/shared/content/sectionPalettes";

function setVar(el: HTMLElement, name: string, value: string): void {
  if (el.style.getPropertyValue(name) !== value) {
    el.style.setProperty(name, value);
  }
}

/**
 * Stage-палитра на :root (фон сцены, HUD вне панелей).
 * Не пишем body.style.color — иначе inherit/переходы перекрашивают панели,
 * у которых свои токены ещё не перекрыли каскад.
 */
export function applyPaletteToDocument(palette: SectionPalette, sectionId: string): void {
  const root = document.documentElement;
  setVar(root, "--stage-bg", palette.bg);
  setVar(root, "--stage-fg", palette.fg);
  setVar(root, "--bg", palette.bg);
  setVar(root, "--text", palette.fg);
  setVar(root, "--panel", palette.panel);
  setVar(root, "--panel-alt", palette.panel);
  setVar(root, "--border", palette.border);
  setVar(root, "--accent", palette.accent);
  setVar(root, "--accent-ink", palette.accentInk);
  setVar(root, "--muted", palette.muted);
  if (document.body.style.backgroundColor !== palette.bg) {
    document.body.style.backgroundColor = palette.bg;
  }
  // Сбрасываем старый inline color, если остался с прошлых версий.
  if (document.body.style.color) document.body.style.color = "";
  if (document.body.getAttribute("data-section") !== sectionId) {
    document.body.setAttribute("data-section", sectionId);
  }
}
