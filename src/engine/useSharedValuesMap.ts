import type { SharedValue } from 'react-native-reanimated'
import { useSharedValue } from 'react-native-reanimated'

import { CELL_SIZE, EXPLOSION_POOL_SIZE, KEYS, ROWS_COUNT } from '../model/consts'

export type ItemSlotSharedValues = {
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  opacity: SharedValue<number>
  width: SharedValue<number>
  color: SharedValue<string>
  isActive: SharedValue<boolean>
  initialLeft: SharedValue<number>
}

export type ExplosionPoolSlotSharedValues = {
  progress: SharedValue<number>
  centerX: SharedValue<number>
  centerY: SharedValue<number>
  color: SharedValue<string>
}

export type SharedValuesMap = {
  score: SharedValue<number>
  multiplier: SharedValue<number>
  translateX: SharedValue<number>
  /** Bounds for pan gesture (UI-thread only). Set on begin, cleared on end. */
  gesture: {
    active: SharedValue<boolean>
    minPx: SharedValue<number>
    maxPx: SharedValue<number>
  }
  indicator: {
    opacity: SharedValue<number>
    width: SharedValue<number>
    left: SharedValue<number>
  }
  ghost: {
    translateX: SharedValue<number>
    translateY: SharedValue<number>
    opacity: SharedValue<number>
    width: SharedValue<number>
    color: SharedValue<string>
  }
  overlay: {
    opacity: SharedValue<number>
    gameOverScore: SharedValue<number>
    /** Pause overlay visibility (0 = hidden, 1 = visible) */
    pauseOpacity: SharedValue<number>
  }
  items: Record<string, ItemSlotSharedValues>
  explosionPool: ExplosionPoolSlotSharedValues[]
}

export function useSharedValuesMap(): SharedValuesMap {
  const score = useSharedValue(0)
  const multiplier = useSharedValue(0)
  const translateX = useSharedValue(0)

  const gesture = {
    active: useSharedValue(false),
    minPx: useSharedValue(0),
    maxPx: useSharedValue(0)
  }

  const indicator = {
    opacity: useSharedValue(0),
    width: useSharedValue(-1),
    left: useSharedValue(-1)
  }

  const ghost = {
    translateX: useSharedValue(-1),
    translateY: useSharedValue(-1),
    opacity: useSharedValue(0),
    width: useSharedValue(0),
    color: useSharedValue('transparent')
  }

  const overlay = {
    opacity: useSharedValue(0),
    gameOverScore: useSharedValue(0),
    pauseOpacity: useSharedValue(0)
  }

  const items = KEYS.reduce(
    (acc, key) => {
      acc[key] = {
        translateX: useSharedValue(-1 * CELL_SIZE),
        translateY: useSharedValue(ROWS_COUNT * CELL_SIZE),
        opacity: useSharedValue(1),
        width: useSharedValue(0),
        color: useSharedValue('#fff'),
        isActive: useSharedValue(false),
        initialLeft: useSharedValue(-1)
      }
      return acc
    },
    {} as Record<string, ItemSlotSharedValues>
  )

  const explosionPool: ExplosionPoolSlotSharedValues[] = [
    {
      progress: useSharedValue(0),
      centerX: useSharedValue(-1000),
      centerY: useSharedValue(-1000),
      color: useSharedValue('#fff')
    },
    {
      progress: useSharedValue(0),
      centerX: useSharedValue(-1000),
      centerY: useSharedValue(-1000),
      color: useSharedValue('#fff')
    },
    {
      progress: useSharedValue(0),
      centerX: useSharedValue(-1000),
      centerY: useSharedValue(-1000),
      color: useSharedValue('#fff')
    },
    {
      progress: useSharedValue(0),
      centerX: useSharedValue(-1000),
      centerY: useSharedValue(-1000),
      color: useSharedValue('#fff')
    },
    {
      progress: useSharedValue(0),
      centerX: useSharedValue(-1000),
      centerY: useSharedValue(-1000),
      color: useSharedValue('#fff')
    },
    {
      progress: useSharedValue(0),
      centerX: useSharedValue(-1000),
      centerY: useSharedValue(-1000),
      color: useSharedValue('#fff')
    }
  ]

  return {
    score,
    multiplier,
    translateX,
    gesture,
    indicator,
    ghost,
    overlay,
    items,
    explosionPool
  }
}
