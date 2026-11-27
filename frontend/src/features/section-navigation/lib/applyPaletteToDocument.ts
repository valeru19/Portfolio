import type { SectionPalette } from "@/shared/content/sectionPalettes";

import { SPIRAL_DOM_ATTR } from "../model/panelStateAttrs";

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
  // Не пишем body.style.backgroundColor — иначе transition по --stage-bg не работает.
  if (document.body.style.backgroundColor) document.body.style.backgroundColor = "";
  if (document.body.style.color) document.body.style.color = "";
  if (document.body.getAttribute("data-section") !== sectionId) {
    document.body.setAttribute("data-section", sectionId);
  }
}

/**
 * Смена --stage-bg без CSS-transition на .stage (wrap last→first / посадка без мигания).
 */
export function withStageBgTransitionDisabled(fn: () => void): void {
  const stage = document.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.stage}]`);
  if (!stage) {
    fn();
    return;
  }
  const prev = stage.style.transition;
  stage.style.transition = "none";
  fn();
  // Commit цвета в том же кадре, иначе transition:none снимется до paint.
  void stage.offsetHeight;
  stage.style.transition = prev;
}
