/**
 * Types used by SlidingBlocks. Self-contained - no host dependencies.
 */

/** Block rendering (Skia-drawn blocks) */
export type BlockSettings = {
  radius: number
  borderWidth: number
  borderColor: string
  frostHighlightColor: string
  frostHighlightHeightRatio: number
  superGradientColors: [number, number, number][]
  superGradientSteps: number
}

/** Explosion particle effect */
export type ExplosionSettings = {
  radius: number
  baseParticleSize: number
  riseHeight: number
  fallDistance: number
  pictureSize: number
}

/** Checkerboard grid */
export type CheckerboardSettings = {
  defaultBaseColor: string
  defaultDarkOpacity: number
  defaultLightOpacity: number
}

/** Explosion preset counts */
export type ExplosionPresetsSettings = {
  particleCount: number
  trajectoryPresetCount: number
  shapePresetCount: number
}

/** Game layout config */
export type GameLayoutSettings = {
  rowsCount: number
  columnsCount: number
  padding: number
  explosionPoolSize: number
  keysSize: number
}

export type AppSettings = {
  block: BlockSettings
  explosion: ExplosionSettings
  checkerboard: CheckerboardSettings
  explosionPresets: ExplosionPresetsSettings
  gameLayout: GameLayoutSettings
}
