/** Задержка кроссфейда solid→blur (не длиннее flip). */
export const PANEL_REVEAL_MS = 480;

/** Запомнить реальную высоту scroll для contain-intrinsic-size. */
export function rememberPanelIntrinsicHeight(scroll: HTMLElement): void {
  // Только если контент реально нарисован (не skipped content-visibility).
  const h = scroll.scrollHeight;
  if (h < 40) return;
  const next = `${h}px`;
  if (scroll.style.getPropertyValue("--panel-intrinsic-h") !== next) {
    scroll.style.setProperty("--panel-intrinsic-h", next);
  }
}

export function decodePanelImages(section: HTMLElement): void {
  section.querySelectorAll("img").forEach((img) => {
    if (img.complete) return;
    if (typeof img.decode === "function") {
      void img.decode().catch(() => undefined);
    }
  });
}
