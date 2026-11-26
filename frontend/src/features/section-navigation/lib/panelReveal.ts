import { PANEL_STATE_ATTR, setPanelStateAttr } from "../model/panelStateAttrs";

/** Задержка кроссфейда frost→контент (чуть короче flip). */
export const PANEL_REVEAL_MS = 480;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

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

/**
 * Плавно снять «цветной квадрат» (frost/blur-lite/far):
 * 1) frost держит заливку, 2) включаем контент, 3) opacity frost → 0.
 */
export async function revealPanelFromFrost(
  section: HTMLElement,
  scroll: HTMLElement,
  options?: { keepBlurLite?: boolean },
): Promise<void> {
  const wasFar = section.hasAttribute(PANEL_STATE_ATTR.far);
  const wasLite = section.hasAttribute(PANEL_STATE_ATTR.blurLite);
  if (!wasFar && !wasLite && !section.hasAttribute(PANEL_STATE_ATTR.frost)) {
    return;
  }

  // Пока frost непрозрачен — можно безопасно включить контент.
  setPanelStateAttr(section, PANEL_STATE_ATTR.frost, true);
  if (wasFar) {
    setPanelStateAttr(section, PANEL_STATE_ATTR.far, false);
    await nextFrame();
    decodePanelImages(section);
    rememberPanelIntrinsicHeight(scroll);
    await nextFrame();
  }

  setPanelStateAttr(section, PANEL_STATE_ATTR.revealing, true);
  if (!options?.keepBlurLite) {
    setPanelStateAttr(section, PANEL_STATE_ATTR.blurLite, false);
  }
  setPanelStateAttr(section, PANEL_STATE_ATTR.frost, false);

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, PANEL_REVEAL_MS);
  });
  setPanelStateAttr(section, PANEL_STATE_ATTR.revealing, false);
}

/**
 * Прогрев целевой панели и соседей перед длинным ходом (по 1 панели / кадр).
 */
export async function warmPanelsForJump(
  panels: Array<{ section: HTMLElement; scroll: HTMLElement }>,
): Promise<void> {
  for (const { section, scroll } of panels) {
    setPanelStateAttr(section, PANEL_STATE_ATTR.frost, true);
    setPanelStateAttr(section, PANEL_STATE_ATTR.far, false);
    await nextFrame();
    decodePanelImages(section);
    rememberPanelIntrinsicHeight(scroll);
    // После прогрева frost можно сразу убрать коротким fade, если панель станет near.
  }
  await nextFrame();
}
