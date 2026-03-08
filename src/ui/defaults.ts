import type { AppSettings } from '../types/settings'

/** Default visual settings. No persistence - used when settings prop not provided. */
export const DEFAULT_SLIDING_BLOCKS_SETTINGS: AppSettings = {
  block: {
    radius: 12,
    borderWidth: 1,
    borderColor: 'rgba(180,185,195,0.75)',
    frostHighlightColor: 'rgba(255,255,255,0.05)',
    frostHighlightHeightRatio: 0.25,
    superGradientColors: [
      [120, 0, 255],
      [255, 180, 0]
    ],
    superGradientSteps: 20
  },
  explosion: {
    radius: 120,
    baseParticleSize: 18,
    riseHeight: 100,
    fallDistance: 400,
    pictureSize: 450
  },
  checkerboard: {
    defaultBaseColor: 'rgba(0,0,0,1)',
    defaultDarkOpacity: 0.2,
    defaultLightOpacity: 0.3
  },
  explosionPresets: {
    particleCount: 8,
    trajectoryPresetCount: 8,
    shapePresetCount: 8,
    performanceMode: 'default' as const
  },
  gameLayout: {
    rowsCount: 10,
    columnsCount: 8,
    padding: 30,
    explosionPoolSize: 16,
    keysSize: 48
  },
  animations: {
    completeSnapMs: 50,
    itemDropMs: 200,
    willRemovePulseMs: 80,
    removeFadeMs: 600,
    removeExplosionMs: 800,
    gameOverInMs: 250,
    gameOverOutMs: 200,
    pauseOverlayMs: 200,
    loadingBarFillMs: 400
  },
  feedback: {
    blockIdle: 0.8,
    willRemovePulseMin: 0.85,
    ghostActive: 0.4,
    indicatorActive: 0.1
  }
}

function deepMerge<T extends object>(base: T, overrides?: Partial<T>): T {
  if (!overrides) return base
  const result = { ...base }
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const val = overrides[key]
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      ;(result as Record<string, unknown>)[key as string] = deepMerge(
        (base as Record<string, unknown>)[key as string] as object,
        val as Partial<object>
      )
    } else if (val !== undefined) {
      ;(result as Record<string, unknown>)[key as string] = val
    }
  }
  return result
}

import type { SlidingBlocksSettingsOverrides } from './SlidingBlocks.types'

export function mergeSettings(
  overrides?: SlidingBlocksSettingsOverrides
): AppSettings {
  if (!overrides) return DEFAULT_SLIDING_BLOCKS_SETTINGS
  return deepMerge(
    DEFAULT_SLIDING_BLOCKS_SETTINGS,
    overrides as Partial<AppSettings>
  ) as AppSettings
}
