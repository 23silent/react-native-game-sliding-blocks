/**
 * Editable settings schema.
 * All values are persisted via AsyncStorage.
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
  /** 'low' = fewer particles, circles only - smoother on low-end Android */
  performanceMode?: 'default' | 'low'
}

/** Game layout consts */
export type GameLayoutSettings = {
  rowsCount: number
  columnsCount: number
  padding: number
  explosionPoolSize: number
  keysSize: number
}

/** Animation durations (ms) */
export type AnimationSettings = {
  completeSnapMs: number
  itemDropMs: number
  willRemovePulseMs: number
  removeFadeMs: number
  removeExplosionMs: number
  gameOverInMs: number
  gameOverOutMs: number
  pauseOverlayMs: number
  loadingBarFillMs: number
}

/** Block render mode: image (PNG assets) or skia (drawn blocks) */
export type BlockRenderMode = 'image' | 'skia'

/** Opacity values for visual feedback */
export type FeedbackOpacitySettings = {
  blockIdle: number
  willRemovePulseMin: number
  ghostActive: number
  indicatorActive: number
}

export type AppSettings = {
  blockRenderMode: BlockRenderMode
  block: BlockSettings
  explosion: ExplosionSettings
  checkerboard: CheckerboardSettings
  explosionPresets: ExplosionPresetsSettings
  gameLayout: GameLayoutSettings
  animations: AnimationSettings
  feedback: FeedbackOpacitySettings
}

/** Partial overrides for merging with defaults */
export type AppSettingsOverrides = {
  blockRenderMode?: BlockRenderMode
  block?: Partial<BlockSettings>
  explosion?: Partial<ExplosionSettings>
  checkerboard?: Partial<CheckerboardSettings>
  explosionPresets?: Partial<ExplosionPresetsSettings>
  gameLayout?: Partial<GameLayoutSettings>
  animations?: Partial<AnimationSettings>
  feedback?: Partial<FeedbackOpacitySettings>
}
