/**
 * Host theme. Used by host screens (SplashScreen, HomeScreen, GameScreen, etc.).
 * Puzzle-game aesthetic: warm wood, cream, and amber accents.
 * SlidingBlocks does not import this; host injects theme via SlidingBlocks props.
 */

/** Shared background — warm cream/beige like a puzzle table */
export const MENU_BG = '#2d2520' as const

/** Secondary background — wood-like panel */
export const PANEL_BG_DARK = 'rgba(61,46,40,0.95)' as const

/** Home screen menu button layout */
export const HOME_SCREEN = {
  BUTTON_WIDTH: 240,
  BUTTON_HEIGHT: 54,
  BUTTON_GAP: 12,
  CARD_PADDING: 20,
  CARD_BORDER_RADIUS: 16
} as const

/** Preloader delay after load complete (ms) — host uses for overlay transition */
export const POST_LOAD_DELAY_MS = 700

/** Shared text colors — high contrast on warm dark */
export const TEXT_PRIMARY = '#f5ebe0' as const
export const TEXT_SECONDARY = 'rgba(232,213,196,0.95)' as const
export const TEXT_MUTED = 'rgba(210,180,160,0.85)' as const
export const TEXT_HINT = 'rgba(180,155,135,0.8)' as const

/** Button colors — amber/gold puzzle-game accent */
export const BUTTON_PRIMARY = 'rgba(212,163,96,0.95)' as const
export const BUTTON_PRIMARY_TEXT = '#1a1512' as const
export const BUTTON_SECONDARY = 'rgba(139,90,43,0.5)' as const

/** Panel/input styles */
export const PANEL_BG = 'rgba(61,46,40,0.9)' as const
export const INPUT_BORDER = 'rgba(139,90,43,0.5)' as const

/** Card / elevated surface */
export const CARD_BG = 'rgba(45,37,32,0.6)' as const

/** Reset/danger button */
export const RESET_BUTTON_BG = 'rgba(180,70,60,0.25)' as const
export const RESET_BUTTON_TEXT = 'rgba(248,180,175,0.95)' as const

/** SlidingBlocks theme — inject via SlidingBlocks theme prop */
export const SLIDING_BLOCKS_THEME = {
  block: {
    borderColor: 'rgba(180,140,100,0.75)',
    superGradientColors: [
      [180, 120, 60],
      [220, 180, 100]
    ] as [number, number, number][],
    fillMode: 'color' as const
  },
  overlay: {
    backdropRgb: '20,15,12',
    backdropMaxAlpha: 0.82,
    boxRgb: '45,37,32',
    boxMaxAlpha: 0.96,
    accentRgb: '212,163,96',
    accentMaxAlpha: 0.9
  },
  loading: {
    backdrop: '#2d2520',
    box: 'rgba(61,46,40,0.98)',
    barTrack: 'rgba(45,37,32,1)',
    barFill: 'rgba(212,163,96,0.9)',
    titleColor: '#f5ebe0'
  },
  scoreBar: {
    gradientColors: [
      'rgba(61,46,40,0.94)',
      'rgba(45,37,32,0.96)',
      'rgba(35,28,24,0.98)'
    ] as [string, string, string],
    pillColor: 'rgba(212,163,96,0.2)',
    labelColor: 'rgba(232,213,196,0.9)',
    valueColor: '#f5ebe0',
    multiplierPillColor: 'rgba(180,120,60,0.3)',
    accentColor: 'rgba(212,163,96,0.9)'
  }
} as const
