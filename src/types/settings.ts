/**
 * Settings types used by SlidingBlocks. Self-contained - no host dependencies.
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
  /** 'low' = fewer particles, circles only - smoother on low-end devices */
  performanceMode?: 'default' | 'low'
}

/** Game layout config */
export type GameLayoutSettings = {
  rowsCount: number
  columnsCount: number
  padding: number
  explosionPoolSize: number
  keysSize: number
}

/** Animation durations (ms) - configurable via settings. */
export type AnimationSettings = {
  completeSnapMs: number
  itemDropMs: number
  willRemovePulseMs: number
  /** Block opacity fade-out when removing. Controls when onRemovingEnd fires. */
  removeFadeMs: number
  /** Explosion particle animation duration. Independent from block opacity. */
  removeExplosionMs: number
  gameOverInMs: number
  gameOverOutMs: number
  pauseOverlayMs: number
  loadingBarFillMs: number
}

/** Opacity values for visual feedback - configurable via settings. */
export type FeedbackOpacitySettings = {
  blockIdle: number
  willRemovePulseMin: number
  ghostActive: number
  indicatorActive: number
}

export type AppSettings = {
  block: BlockSettings
  explosion: ExplosionSettings
  checkerboard: CheckerboardSettings
  explosionPresets: ExplosionPresetsSettings
  gameLayout: GameLayoutSettings
  animations: AnimationSettings
  feedback: FeedbackOpacitySettings
}
