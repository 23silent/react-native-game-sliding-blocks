/**
 * Host theme. Used by host screens (SplashScreen, HomeScreen, GameScreen, etc.).
 * SlidingBlocks does not import this; host injects theme via SlidingBlocks props.
 */

/** Shared background for menu/splash screens */
export const MENU_BG = 'rgba(15,23,42,0.98)' as const

/** Home screen menu button layout */
export const HOME_SCREEN = {
  BUTTON_WIDTH: 220,
  BUTTON_HEIGHT: 52,
  BUTTON_GAP: 16
} as const

/** Preloader delay after load complete (ms) — host uses for overlay transition */
export const POST_LOAD_DELAY_MS = 700

/** Shared text colors */
export const TEXT_PRIMARY = 'white' as const
export const TEXT_SECONDARY = 'rgba(203,213,225,0.9)' as const
export const TEXT_MUTED = 'rgba(203,213,225,0.7)' as const
export const TEXT_HINT = 'rgba(203,213,225,0.6)' as const

/** Button colors */
export const BUTTON_PRIMARY = 'rgba(59,130,246,0.9)' as const
export const BUTTON_SECONDARY = 'rgba(59,130,246,0.35)' as const

/** Panel/input styles */
export const PANEL_BG = 'rgba(30,41,59,0.8)' as const
export const INPUT_BORDER = 'rgba(71,85,105,0.5)' as const

/** Reset/danger button */
export const RESET_BUTTON_BG = 'rgba(239,68,68,0.2)' as const
export const RESET_BUTTON_TEXT = 'rgba(248,113,113,0.95)' as const

/** SlidingBlocks theme — inject via SlidingBlocks theme prop */
export const SLIDING_BLOCKS_THEME = {
  block: {
    borderColor: 'rgba(180,185,195,0.75)',
    superGradientColors: [
      [120, 0, 255],
      [255, 180, 0]
    ] as [number, number, number][],
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
    ] as [string, string, string],
    pillColor: 'rgba(59,130,246,0.25)',
    labelColor: 'rgba(203,213,225,0.9)',
    valueColor: 'white',
    multiplierPillColor: 'rgba(168,85,247,0.2)',
    accentColor: 'rgba(59,130,246,0.85)'
  }
} as const
