import type {
  AppSettings,
  BlockSettings,
  CheckerboardSettings,
  ExplosionPresetsSettings,
  ExplosionSettings,
  GameLayoutSettings
} from '../types'
import type { GameConfig } from '../config'
import type { IGameEngine } from '../engine'

/** Block fill: 'image' = PNG assets, 'color' = solid from segment, 'gradient' = gradient (super blocks) */
export type BlockFillMode = 'image' | 'color' | 'gradient'

/** Block theme — border and fill styling */
export type BlockTheme = {
  /** Border color around blocks */
  borderColor: string
  /** Gradient colors for super blocks. RGB tuples [R,G,B][] */
  superGradientColors: [number, number, number][]
  /** Fill: 'image' | 'color' | 'gradient'. Use blockRenderMode for image vs skia; gradient applies to super blocks. */
  fillMode: BlockFillMode
}

/** Theme for SlidingBlocks UI (overlays, loading, score bar, blocks). Host injects via props. */
export type SlidingBlocksTheme = {
  block: BlockTheme
  overlay: {
    backdropRgb: string
    backdropMaxAlpha: number
    boxRgb: string
    boxMaxAlpha: number
    accentRgb: string
    accentMaxAlpha: number
  }
  loading: {
    backdrop: string
    box: string
    barTrack: string
    barFill: string
    titleColor: string
  }
  scoreBar: {
    gradientColors: [string, string, string]
    pillColor: string
    labelColor: string
    valueColor: string
    multiplierPillColor: string
    accentColor: string
  }
}

/** Default SlidingBlocks theme when host does not provide one. */
export const DEFAULT_SLIDING_BLOCKS_THEME: SlidingBlocksTheme = {
  block: {
    borderColor: 'rgba(180,185,195,0.75)',
    superGradientColors: [
      [120, 0, 255],
      [255, 180, 0]
    ],
    fillMode: 'color' as const
  },
  overlay: {
    backdropRgb: '0,0,0',
    backdropMaxAlpha: 0.75,
    boxRgb: '30,41,59',
    boxMaxAlpha: 0.95,
    accentRgb: '59,130,246',
    accentMaxAlpha: 0.9
  },
  loading: {
    backdrop: '#0f172a',
    box: 'rgba(30,41,59,1)',
    barTrack: 'rgba(15,23,42,1)',
    barFill: 'rgba(59,130,246,0.95)',
    titleColor: 'white'
  },
  scoreBar: {
    gradientColors: [
      'rgba(30,41,59,0.92)',
      'rgba(15,23,42,0.95)',
      'rgba(15,23,42,0.98)'
    ],
    pillColor: 'rgba(59,130,246,0.25)',
    labelColor: 'rgba(203,213,225,0.9)',
    valueColor: 'white',
    multiplierPillColor: 'rgba(168,85,247,0.2)',
    accentColor: 'rgba(59,130,246,0.85)'
  }
}

/** Game layout config - no persistence. Host provides values. */
export type SlidingBlocksConfig = GameLayoutSettings

/** Imperative handle for SlidingBlocks. Use with ref to call methods from the host. */
export type SlidingBlocksHandle = {
  /** Show pause overlay and invoke onPause callback. */
  pause: () => void
  /** Hide pause overlay and invoke onResume callback. */
  resume: () => void
  /** Restart the game and hide pause overlay if visible. */
  restart: () => void
  /** Returns true if the game is currently paused. */
  isPaused: () => boolean
}

/** Payload for remove lifecycle callbacks */
export type RemovingPayload = { hasSuper: boolean }

/** Payload for fit-complete callback. Host may play slide sound when hadActualFit. */
export type FitCompletePayload = { hadActualFit: boolean }

/** Callbacks - host handles persistence, navigation, analytics, sounds, etc. */
export type SlidingBlocksCallbacks = {
  /** Called when score changes (after each remove). Host may persist. */
  onScoreChange?: (score: number) => void
  /** Called when game ends. Host may persist high score. */
  onGameOver?: (score: number) => void
  /** Called when user taps pause. */
  onPause?: () => void
  /** Called when user resumes from pause. */
  onResume?: () => void
  /** Called when user restarts (from pause overlay or game-over overlay). */
  onRestart?: () => void
  /** Called when user taps "Finish" in pause overlay. Host navigates away. */
  onFinish?: () => void
  /** Called when pan gesture starts (user begins dragging). */
  onGestureStart?: () => void
  /** Called when pan gesture ends (user releases finger). */
  onGestureEnd?: () => void
  /** Called when blocks start the removing animation (WillRemove → Removing). */
  onRemovingStart?: (payload: RemovingPayload) => void
  /** Called when the remove animation completes. */
  onRemovingEnd?: (payload: RemovingPayload) => void
  /** Called when blocks start fitting/snapping (slide-to-slot animation begins). */
  onFitStart?: () => void
  /** Called when the fit/snap animation completes. hadActualFit=true when blocks actually moved. */
  onFitComplete?: (payload: FitCompletePayload) => void
}

/**
 * Image source - require() result in React Native (numeric asset ID).
 * Host provides these; if omitted, slidingBlocks uses fallbacks (solid color bg, skia blocks).
 */
export type ImageSource = number

/**
 * Block images: color hex -> [1x1, 1x2, 1x3, 1x4] image sources.
 * Omit or provide empty to use skia-drawn blocks (no PNG assets).
 */
export type BlockImagesMap = Record<
  string,
  readonly [ImageSource, ImageSource, ImageSource, ImageSource]
>

/**
 * Injectable assets. All optional. If not provided: no bg (solid color), no block images (skia blocks), no sounds.
 */
export type SlidingBlocksAssets = {
  /** Block PNGs per color. Omit for skia-drawn blocks. */
  blockImages?: BlockImagesMap
  /** Background image. Omit for solid color fallback. */
  backgroundImage?: ImageSource
}

/** Visual settings overrides - merged with defaults. No persistence. */
export type SlidingBlocksSettingsOverrides = {
  block?: Partial<BlockSettings>
  explosion?: Partial<ExplosionSettings>
  checkerboard?: Partial<CheckerboardSettings>
  explosionPresets?: Partial<ExplosionPresetsSettings>
}

export type SlidingBlocksProps = {
  /** Game layout. Required. */
  config: SlidingBlocksConfig
  /** Optional pre-created engine. When provided, config must match. Omit to create internally. */
  engine?: IGameEngine
  /** Injectable assets (block images, background). Omit for fallbacks: solid bg, skia blocks. */
  assets?: SlidingBlocksAssets
  /** Theme for overlays, loading, score bar. Host injects from theme config. */
  theme?: Partial<SlidingBlocksTheme>
  /** Callbacks. Host handles persistence, navigation, sounds, etc. */
  callbacks?: SlidingBlocksCallbacks
  /** Visual settings overrides. Merged with defaults. */
  settings?: SlidingBlocksSettingsOverrides
  /** 'skia' = draw blocks (no assets); 'image' = PNG assets. */
  blockRenderMode?: 'skia' | 'image'
  /** Show "Finish" button in pause overlay. Use with onFinish callback. */
  showFinishOption?: boolean
  /** Loading progress (0..1). */
  onLoadProgress?: (progress: number) => void
  /** Called when game assets/init complete. */
  onLoadComplete?: () => void
}

/** Internal context - config + settings + callbacks + theme. */
export type SlidingBlocksContextValue = {
  config: GameConfig
  settings: AppSettings
  theme: SlidingBlocksTheme
  callbacks: Required<SlidingBlocksCallbacks>
  showFinishOption: boolean
}
