/**
 * UI layout constants for hit-testing and rendering.
 * Keep in sync when changing GameCanvas or overlay layout.
 */

/** Top actions bar Pause button (hit area and visual) */
export const TOP_PAUSE = {
  LEFT_OFFSET: 10,
  WIDTH: 80,
  TOP_OFFSET: 8,
  HEIGHT: 40
} as const

/** Score bar layout — zones to avoid overlap */
export const SCORE_BAR = {
  HEIGHT: 56,
  PADDING_H: 16,
  PAUSE_GAP: 12,
  STATS_GAP: 12,
  STATS_RIGHT_GAP: 16,
  PILL_PADDING: 10,
  PILL_MIN_WIDTH: 64
} as const

/** Pause overlay modal */
export const PAUSE_OVERLAY = {
  BOX_WIDTH: 200,
  BOX_HEIGHT: 220,
  BUTTON_WIDTH: 150,
  BUTTON_HEIGHT: 40,
  BUTTON_GAP: 12,
  FIRST_BUTTON_TOP: 70
} as const

/** Game-over overlay modal */
export const GAME_OVER_OVERLAY = {
  BOX_WIDTH: 220,
  BOX_HEIGHT: 140,
  BUTTON_WIDTH: 140,
  BUTTON_HEIGHT: 44,
  BUTTON_TOP_OFFSET: 20
} as const

/** Loading overlay (preloader) */
export const LOADING_OVERLAY = {
  BOX_WIDTH: 260,
  BOX_HEIGHT: 80,
  BAR_HEIGHT: 10,
  BAR_RADIUS: 4,
  BAR_INSET: 16,
  MIN_DISPLAY_MS: 600,
  POST_LOAD_DELAY_MS: 700,
  FILL_ANIMATION_DURATION_MS: 400
} as const

/** Game root layout */
export const GAME_ROOT = {
  ACTIONS_BAR_HEIGHT: 70,
  DIVIDER_HEIGHT: 12
} as const

/** Default corner radius for Skia buttons */
export const SKIA_BUTTON_RADIUS = 10
