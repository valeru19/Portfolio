/** Golden-ratio spiral constants from legacy (φ ≈ ASPECT). */
export const ASPECT = 0.618033;
export const AXIS = 0.7237;
/**
 * Panel size vs spiral reference width. Must stay at φ so adjacent arms
 * tessellate — anything larger makes current/prev/next overlap.
 */
export const PANEL_SIZE_RATIO = ASPECT;

export const SMALL_SCREEN_MAX_WIDTH = 960;
export const SECTION_ROTATION_STEP_DEG = 90;

/** Higher threshold = less sensitive section stepping on trackpads/mice. */
export const WHEEL_THRESHOLD = 72;
export const WHEEL_ACC_DECAY_MS = 280;
export const WHEEL_STEP_LOCK_MS = 560;
/** Soften manual panel scroll deltas under CSS transforms. */
export const PANEL_WHEEL_SCROLL_FACTOR = 0.38;
/** rAF lerp toward target scrollTop (0–1). Lower = smoother / slower catch-up. */
export const PANEL_SCROLL_LERP = 0.16;

export const TOUCH_STEP_THRESHOLD = 48;

export const ACCESSIBLE_MODE_VALUE = "accessible";
export const SPIRAL_MODE_VALUE = "spiral";
