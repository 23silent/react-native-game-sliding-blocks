/**
 * Centralized layout constants for UI hit-testing and rendering.
 * Keep these in sync when changing GameCanvas or GameOverOverlay layout.
 */

/** Top actions bar Restart button (hit area and visual) */
export const TOP_RESTART = {
  LEFT_OFFSET: 10,
  WIDTH: 100,
  TOP_OFFSET: 8,
  HEIGHT: 40
} as const

/** Score bar layout — zones to avoid overlap */
export const SCORE_BAR = {
  HEIGHT: 56,
  PADDING_H: 16,
  RESTART_GAP: 12,
  STATS_GAP: 12,
  PILL_PADDING: 10,
  PILL_MIN_WIDTH: 64
} as const

/** Game-over overlay modal */
export const GAME_OVER_OVERLAY = {
  BOX_WIDTH: 220,
  BOX_HEIGHT: 140,
  BUTTON_WIDTH: 140,
  BUTTON_HEIGHT: 44,
  /** Vertical offset of button from center */
  BUTTON_TOP_OFFSET: 20
} as const

/** Loading overlay (preloader) */
export const LOADING_OVERLAY = {
  BOX_WIDTH: 260,
  BOX_HEIGHT: 80,
  BAR_HEIGHT: 8,
  BAR_RADIUS: 4,
  BAR_INSET: 16,
  /** Minimum time to show loading (ms) — avoids flash on fast loads */
  MIN_DISPLAY_MS: 600
} as const
