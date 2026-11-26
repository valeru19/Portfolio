/** Маркеры состояния панелей спирали — пара к attribute-селекторам CSS Modules. */
export const PANEL_STATE_ATTR = {
  active: "data-active",
  /** Секции с индексом больше текущей — «следующие», для hover-preview. */
  ahead: "data-ahead",
  /**
   * Accessible card-stack: смещение относительно текущей (−3…3).
   * Не boolean — пишется через setCardDeltaAttr.
   */
  cardDelta: "data-card-delta",
  scrollable: "data-scrollable",
  /**
   * Mid-turn blur roles: `from` | `dest`.
   * Не boolean — пишется через setBlurTurnAttr.
   */
  blurTurn: "data-blur-turn",
  /**
   * Вид панели: sharp | blur | solid (шаг 18).
   * Не boolean — пишется через setPanelViewAttr.
   */
  panelView: "data-panel-view",
} as const;

/** Роль панели в CSS-кроссфейде blur на перевороте. */
export type BlurTurnRole = "from" | "dest";

export function setBlurTurnAttr(element: Element, role: BlurTurnRole | null): void {
  if (role == null) {
    if (element.hasAttribute(PANEL_STATE_ATTR.blurTurn)) {
      element.removeAttribute(PANEL_STATE_ATTR.blurTurn);
    }
    return;
  }
  if (element.getAttribute(PANEL_STATE_ATTR.blurTurn) === role) return;
  element.setAttribute(PANEL_STATE_ATTR.blurTurn, role);
}

/** Пишет data-card-delta идемпотентно (значение −3…3). */
export function setCardDeltaAttr(element: Element, delta: number): void {
  const clamped = Math.max(-3, Math.min(3, delta | 0));
  const next = String(clamped);
  if (element.getAttribute(PANEL_STATE_ATTR.cardDelta) === next) return;
  element.setAttribute(PANEL_STATE_ATTR.cardDelta, next);
}

export type PanelStateAttr = (typeof PANEL_STATE_ATTR)[keyof typeof PANEL_STATE_ATTR];

/** Статические маркеры для global CSS (spin), не переключаются как panel state. */
export const SPIRAL_DOM_ATTR = {
  root: "data-spiral-root",
  stage: "data-spiral-stage",
  section: "data-spiral-section",
  hud: "data-spiral-hud",
  /** Устаревший alias — вуаль; оставлен для coupling-тестов. */
  blurLayer: "data-panel-blur-layer",
  /** Opacity-вуаль (backdrop-filter статичен; анимируется только opacity). */
  blurVeil: "data-panel-blur-veil",
  /**
   * Непрозрачная заливка поверх вуали (solid cover).
   * Alias `data-panel-frost-fill` сохранён для совместимости селекторов.
   */
  solidCover: "data-panel-solid-cover",
  frostFill: "data-panel-frost-fill",
  /** Scroll-box панели — content-visibility на solid. */
  scroll: "data-panel-scroll",
  /** Декоративный solid-квадрат бесконечного хвоста спирали. */
  ghost: "data-spiral-ghost",
} as const;

export function setPanelStateAttr(element: Element, attr: PanelStateAttr, enabled: boolean): void {
  // Идемпотентно: лишний setAttribute/removeAttribute всё равно триггерит наблюдателей/стиль.
  const on = element.hasAttribute(attr);
  if (enabled === on) return;
  if (enabled) element.setAttribute(attr, "");
  else element.removeAttribute(attr);
}
