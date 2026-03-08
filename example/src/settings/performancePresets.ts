/**
 * Host-defined performance presets.
 * One-tap presets that set block style, explosion, and animations.
 */

import type { AppSettings, AppSettingsOverrides } from './types'

export type PerformancePreset = 'extra-low' | 'low' | 'fine' | 'good'

/** Extra-low: minimal animations except itemDropMs for visible blocks-falling feedback */
const EXTRA_LOW_ANIMATIONS = {
  completeSnapMs: 50,
  itemDropMs: 200,
  willRemovePulseMs: 50,
  removeFadeMs: 0,
  removeExplosionMs: 0,
  gameOverInMs: 250,
  gameOverOutMs: 200,
  pauseOverlayMs: 200,
  loadingBarFillMs: 400
}

const DEFAULT_ANIMATIONS = {
  completeSnapMs: 50,
  itemDropMs: 200,
  willRemovePulseMs: 80,
  removeFadeMs: 600,
  removeExplosionMs: 800,
  gameOverInMs: 250,
  gameOverOutMs: 200,
  pauseOverlayMs: 200,
  loadingBarFillMs: 400
}

export const PERFORMANCE_PRESET_OVERRIDES: Record<
  PerformancePreset,
  AppSettingsOverrides
> = {
  'extra-low': {
    blockRenderMode: 'image',
    explosionPresets: {
      explosionEnabled: false,
      particleCount: 4,
      circlesOnly: true
    },
    animations: EXTRA_LOW_ANIMATIONS
  },
  low: {
    blockRenderMode: 'image',
    explosionPresets: {
      explosionEnabled: false
    },
    animations: DEFAULT_ANIMATIONS
  },
  fine: {
    blockRenderMode: 'image',
    explosionPresets: {
      explosionEnabled: true,
      particleCount: 6,
      circlesOnly: true,
      trajectoryPresetCount: 6,
      shapePresetCount: 6
    },
    animations: DEFAULT_ANIMATIONS
  },
  good: {
    blockRenderMode: 'skia',
    explosionPresets: {
      explosionEnabled: true,
      particleCount: 8,
      circlesOnly: false,
      trajectoryPresetCount: 8,
      shapePresetCount: 8
    },
    animations: DEFAULT_ANIMATIONS
  }
}

export function getPerformancePresetOverrides(
  preset: PerformancePreset
): AppSettingsOverrides {
  return PERFORMANCE_PRESET_OVERRIDES[preset]
}

/**
 * Returns which preset (if any) matches the current settings.
 * Used to highlight the selected preset.
 */
export function getActivePreset(
  settings: AppSettings
): PerformancePreset | null {
  const { blockRenderMode, explosionPresets, animations } = settings
  const exp = explosionPresets
  const anim = animations

  const isExtraLow =
    blockRenderMode === 'image' &&
    exp.explosionEnabled === false &&
    anim.completeSnapMs === 0 &&
    anim.itemDropMs === EXTRA_LOW_ANIMATIONS.itemDropMs &&
    anim.removeFadeMs === 0

  if (isExtraLow) {
    return 'extra-low'
  }
  const isLow =
    blockRenderMode === 'image' &&
    exp.explosionEnabled === false &&
    anim.itemDropMs === DEFAULT_ANIMATIONS.itemDropMs
  if (isLow) {
    return 'low'
  }
  if (
    blockRenderMode === 'image' &&
    exp.explosionEnabled !== false &&
    exp.particleCount === 6 &&
    exp.circlesOnly === true
  ) {
    return 'fine'
  }
  if (
    blockRenderMode === 'skia' &&
    exp.explosionEnabled !== false &&
    exp.particleCount === 8 &&
    exp.circlesOnly === false
  ) {
    return 'good'
  }
  return null
}
