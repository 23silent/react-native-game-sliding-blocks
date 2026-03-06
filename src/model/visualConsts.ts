/**
 * Visual constants for block rendering, explosions, and grid styling.
 */

/** Block rendering (Skia-drawn blocks) */
export const BLOCK = {
  RADIUS: 12,
  BORDER_WIDTH: 1,
  /** Border for glass-like blocks */
  BORDER_COLOR: 'rgba(180,185,195,0.75)',
  /** Frosted glass overlay: subtle white highlight at top */
  FROST_HIGHLIGHT_COLOR: 'rgba(255,255,255,0.05)',
  FROST_HIGHLIGHT_HEIGHT_RATIO: 0.25,
  /** Super block gradient: purple → gold */
  SUPER_GRADIENT_COLORS: [[120, 0, 255], [255, 180, 0]] as [number, number, number][],
  SUPER_GRADIENT_STEPS: 20
} as const

/** Explosion particle effect */
export const EXPLOSION = {
  RADIUS: 120,
  BASE_PARTICLE_SIZE: 18,
  RISE_HEIGHT: 100,
  FALL_DISTANCE: 400,
  PICTURE_SIZE: 450
} as const

/** Checkerboard grid defaults */
export const CHECKERBOARD = {
  DEFAULT_BASE_COLOR: 'rgba(0,0,0,1)',
  DEFAULT_DARK_OPACITY: 0.2,
  DEFAULT_LIGHT_OPACITY: 0.3
} as const

/** Explosion preset counts (used in explosionPresets) */
export const EXPLOSION_PRESETS = {
  PARTICLE_COUNT: 8,
  TRAJECTORY_PRESET_COUNT: 8,
  SHAPE_PRESET_COUNT: 8
} as const
