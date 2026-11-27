/** Константы золотой спирали (φ ≈ ASPECT). */
export const ASPECT = 0.618033;
export const AXIS = 0.7237;
/**
 * Размер панели относительно ширины спирали.
 * Держим равным φ, чтобы соседние рукава стыковались без наезда друг на друга.
 */
export const PANEL_SIZE_RATIO = ASPECT;

export const SMALL_SCREEN_MAX_WIDTH = 960;
export const SECTION_ROTATION_STEP_DEG = 90;

/**
 * Порог накопления wheel → шаг секции (спираль).
 * ~110: один уверенный жест / ~1–2 щелчка мыши; случайные микродвижения не листают.
 */
export const WHEEL_THRESHOLD = 110;
/** Быстрее сбрасываем незавершённый жест — меньше «догоняющих» шагов. */
export const WHEEL_ACC_DECAY_MS = 240;
/**
 * Длительность одношагового flip (ms) — единый источник для твина и wheel-lock.
 * LOCKED single-step ceiling (goingBack); не расходиться с animationDurationMs.
 */
export const SPIRAL_FLIP_DURATION_MS = 700;
/** Блокировка следующего шага = длительности flip (один жест ≈ один шаг). */
export const WHEEL_STEP_LOCK_MS = SPIRAL_FLIP_DURATION_MS;
/**
 * «Обычный скролл» (карточки): один щелчок мыши (~100) должен листать.
 * Спиральный порог 110 + decay 240 оставлял одиночный notch без шага.
 */
export const ACCESSIBLE_WHEEL_THRESHOLD = 48;
/** Lock карточного шага ≈ CSS-transition карточки (~0.56s). */
export const ACCESSIBLE_WHEEL_STEP_LOCK_MS = 500;
/** Смягчение дельты ручного скролла панели под CSS-трансформами. */
export const PANEL_WHEEL_SCROLL_FACTOR = 0.38;
/** rAF-lerp к целевому scrollTop (0–1). Меньше = плавнее/медленнее догон. */
export const PANEL_SCROLL_LERP = 0.16;

export const TOUCH_STEP_THRESHOLD = 48;

export const ACCESSIBLE_MODE_VALUE = "accessible";
export const SPIRAL_MODE_VALUE = "spiral";

/** Длительность CSS-перехода карточки в линейном режиме (ms). */
export const ACCESSIBLE_CARD_TRANSITION_MS = 560;

/**
 * Смена spiral ↔ accessible: только opacity/translate сцены (без filter/morph).
 * Коротко — иначе снова фризы на тяжёлых секциях.
 */
export const MODE_TRANSITION_EXIT_MS = 140;
export const MODE_TRANSITION_ENTER_MS = 180;

/**
 * Размытие неактивных панелей (px).
 * Ниже ~12 текст читается сквозь blur; выше ~20 дороже paint под спиралью.
 */
export const PANEL_BLUR_PX = 16;

/** Декоративные solid-квадраты «бесконечной» спирали за последней секцией. */
export const SPIRAL_INFINITY_GHOST_COUNT = 12;

/** Порог «осталось ≤1 шаг» для проявления dest/next на длинном ходе (градусы). */
export const LONG_JUMP_REVEAL_REMAINING_DEG = 90;

/** Пружина на последней секции: угол выноса вперёд (градусы) и длительность (мс). */
export const EDGE_SPRING_DEG = 7;
export const EDGE_SPRING_MS = 450;
