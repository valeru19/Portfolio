import { PANEL_BLUR_PX } from "../model/constants";
import { PANEL_STATE_ATTR, SPIRAL_DOM_ATTR, setPanelStateAttr } from "../model/panelStateAttrs";

export type PanelBakeRecord = {
  url: string;
  bytes: number;
  width: number;
  height: number;
  themeKey: string;
};

const bakeCache = new Map<string, PanelBakeRecord>();
const bakeInFlight = new Set<string>();

export function getPanelBake(cacheKey: string): PanelBakeRecord | undefined {
  return bakeCache.get(cacheKey);
}

export function estimateBakeCacheBytes(): number {
  let total = 0;
  bakeCache.forEach((r) => {
    total += r.bytes;
  });
  return total;
}

export function clearPanelBakeCache(): void {
  bakeCache.forEach((r) => {
    if (r.url.startsWith("blob:")) URL.revokeObjectURL(r.url);
  });
  bakeCache.clear();
  bakeInFlight.clear();
}

function readCssColor(el: HTMLElement, prop: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(prop).trim();
  return v || fallback;
}

/**
 * Запечённая «размытая» пластина без DOM-capture и без живого filter.
 * Цвет панели + мягкие полосы контента + однократный canvas blur.
 * На mid-jump это одна непрозрачная текстура (без backdrop/veil/frost).
 */
export function bakePanelPlate(
  frame: HTMLElement,
  blurPx = PANEL_BLUR_PX,
  scale = 0.5,
): PanelBakeRecord | null {
  const cssW = frame.offsetWidth;
  const cssH = frame.offsetHeight;
  if (cssW < 16 || cssH < 16) return null;

  const w = Math.max(8, Math.round(cssW * scale));
  const h = Math.max(8, Math.round(cssH * scale));
  const panel = readCssColor(frame, "--panel", "#141414");
  const text = readCssColor(frame, "--text", "#f2f2f2");
  const border = readCssColor(frame, "--border", "#e8e8e8");

  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const sctx = src.getContext("2d");
  if (!sctx) return null;

  sctx.fillStyle = panel;
  sctx.fillRect(0, 0, w, h);
  sctx.strokeStyle = border;
  sctx.lineWidth = Math.max(1, 2 * scale);
  sctx.strokeRect(1, 1, w - 2, h - 2);

  // Имитация блоков текста/карточек — после blur нечитаемо, как live veil.
  sctx.fillStyle = text;
  const pad = Math.max(6, Math.round(14 * scale));
  let y = pad * 2;
  let row = 0;
  while (y < h - pad) {
    sctx.globalAlpha = row % 4 === 0 ? 0.42 : 0.22;
    const lineW = w * (0.35 + ((row * 17) % 40) / 100);
    const lineH = Math.max(3, Math.round(5 * scale));
    sctx.fillRect(pad, y, lineW, lineH);
    if (row % 5 === 0) {
      sctx.globalAlpha = 0.18;
      sctx.fillRect(pad, y + lineH + 2, Math.min(w - pad * 2, 48 * scale), 28 * scale);
      y += 36 * scale;
    } else {
      y += 12 * scale;
    }
    row += 1;
  }
  sctx.globalAlpha = 1;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.filter = `blur(${Math.max(2, blurPx * scale)}px)`;
  octx.drawImage(src, 0, 0);
  octx.filter = "none";

  const url = out.toDataURL("image/webp", 0.72);
  return {
    url,
    bytes: Math.round((url.length * 3) / 4),
    width: w,
    height: h,
    themeKey: `${panel}|${text}`,
  };
}

export function bakeKeyForSection(sectionId: string, themeKey: string): string {
  return `${sectionId}::${themeKey}`;
}

/** Idle: запечь одну панель и положить в кэш + в <img data-panel-bake>. */
export function bakeAndAttachPanel(
  sectionId: string,
  section: HTMLElement,
  force = false,
): PanelBakeRecord | null {
  // Frame = родитель frost/bake слоёв (CSS modules hash на class не используем).
  const target =
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.frostFill}]`)?.parentElement ??
    section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.bake}]`)?.parentElement ??
    (section.firstElementChild instanceof HTMLElement ? section.firstElementChild : section);

  const panel = readCssColor(target, "--panel", "#141414");
  const text = readCssColor(target, "--text", "#f2f2f2");
  const themeKey = `${panel}|${text}`;
  const key = bakeKeyForSection(sectionId, themeKey);
  if (!force && bakeCache.has(key) && !bakeInFlight.has(key)) {
    applyBakeToDom(section, bakeCache.get(key)!);
    return bakeCache.get(key)!;
  }
  if (bakeInFlight.has(key)) return bakeCache.get(key) ?? null;
  bakeInFlight.add(key);
  try {
    const record = bakePanelPlate(target, PANEL_BLUR_PX, 0.5);
    if (!record) return null;
    record.themeKey = themeKey;
    const prev = bakeCache.get(key);
    if (prev?.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
    bakeCache.set(key, record);
    applyBakeToDom(section, record);
    setPanelStateAttr(section, PANEL_STATE_ATTR.baked, true);
    return record;
  } finally {
    bakeInFlight.delete(key);
  }
}

function applyBakeToDom(section: HTMLElement, record: PanelBakeRecord): void {
  const img = section.querySelector<HTMLImageElement>(`[${SPIRAL_DOM_ATTR.bake}]`);
  if (!img) return;
  if (img.getAttribute("src") !== record.url) {
    img.src = record.url;
  }
  img.width = record.width;
  img.height = record.height;
}

/** Показать/скрыть bake-текстуру на панели (без CSS filter). */
export function setPanelBakeVisible(section: HTMLElement, visible: boolean): void {
  setPanelStateAttr(section, PANEL_STATE_ATTR.bakeVisible, visible);
}

const activeBakeAnims = new WeakMap<HTMLElement, Animation>();

export function beginBakeOpacityTurn(
  fromSection: HTMLElement | undefined,
  destSection: HTMLElement | undefined,
  durationSec: number,
): { cancel: () => void } {
  const durationMs = Math.max(16, durationSec * 1000);
  const animations: Animation[] = [];

  const arm = (section: HTMLElement, start: number, end: number) => {
    const img = section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.bake}]`);
    if (!img || typeof img.animate !== "function") {
      setPanelBakeVisible(section, end > 0.5);
      return;
    }
    const prev = activeBakeAnims.get(img);
    prev?.cancel();
    setPanelBakeVisible(section, true);
    img.style.opacity = String(start);
    img.style.willChange = "opacity";
    const anim = img.animate([{ opacity: start }, { opacity: end }], {
      duration: durationMs,
      easing: "ease-in-out",
      fill: "forwards",
    });
    activeBakeAnims.set(img, anim);
    animations.push(anim);
    void anim.finished
      .then(() => {
        img.style.opacity = "";
        img.style.willChange = "";
        setPanelBakeVisible(section, end > 0.05);
        activeBakeAnims.delete(img);
      })
      .catch(() => {
        img.style.willChange = "";
        activeBakeAnims.delete(img);
      });
  };

  if (fromSection) arm(fromSection, 0, 1);
  if (destSection && destSection !== fromSection) arm(destSection, 1, 0);

  return {
    cancel: () => {
      for (const a of animations) a.cancel();
    },
  };
}

export function endBakeOpacityTurn(...sections: Array<HTMLElement | undefined>): void {
  for (const section of sections) {
    if (!section) continue;
    const img = section.querySelector<HTMLElement>(`[${SPIRAL_DOM_ATTR.bake}]`);
    if (!img) continue;
    const prev = activeBakeAnims.get(img);
    prev?.cancel();
    activeBakeAnims.delete(img);
    img.style.opacity = "";
    img.style.willChange = "";
  }
}
