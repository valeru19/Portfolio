/** Константы золотой спирали из legacy (φ ≈ ASPECT). */
export const ASPECT = 0.618033;
export const AXIS = 0.7237;
/**
 * Размер панели относительно ширины спирали.
 * Держим равным φ, чтобы соседние рукава стыковались без наезда друг на друга.
 */
export const PANEL_SIZE_RATIO = ASPECT;

export const SMALL_SCREEN_MAX_WIDTH = 960;
export const SECTION_ROTATION_STEP_DEG = 90;

/** Чем выше порог — тем реже шаг секции на тачпадах/мышах. */
export const WHEEL_THRESHOLD = 72;
export const WHEEL_ACC_DECAY_MS = 280;
export const WHEEL_STEP_LOCK_MS = 560;
/** Смягчение дельты ручного скролла панели под CSS-трансформами. */
export const PANEL_WHEEL_SCROLL_FACTOR = 0.38;
/** rAF-lerp к целевому scrollTop (0–1). Меньше = плавнее/медленнее догон. */
export const PANEL_SCROLL_LERP = 0.16;

export const TOUCH_STEP_THRESHOLD = 48;

export const ACCESSIBLE_MODE_VALUE = "accessible";
export const SPIRAL_MODE_VALUE = "spiral";

/** Размытие неактивных панелей (px). Не раздувать: filter дорог по paint. */
export const PANEL_BLUR_PX = 14;
