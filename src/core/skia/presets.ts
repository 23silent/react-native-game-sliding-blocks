/**
 * Preset reaction rules for common patterns.
 * Use with useReactionRule, ReactiveSlot, or withReaction.
 *
 * All slot types come from types.ts (GestureSlot, HasOpacity, etc.)
 * so presets work with any component that implements the interface.
 */

import type { GestureSlot, GestureSource, HasOpacity } from './types'
import type { ReactionRule } from './reactionRules'

/** @deprecated Use GestureSlot from types instead */
export type SlotWithGesture = GestureSlot

/** @deprecated Use GestureSource from types instead */
export type GestureTranslateX = GestureSource

/**
 * When the slot is "active", sync its translateX with the gesture offset.
 * Use for draggable items that follow the pan gesture.
 */
export function activeGestureSync(
  slot: GestureSlot,
  gestureSource: GestureSource
): ReactionRule<{ tx: number; isActive: boolean }> {
  return {
    watch: () => {
      'worklet'
      return {
        tx: gestureSource.value,
        isActive: slot.isActive.value
      }
    },
    apply: ({ tx, isActive }) => {
      'worklet'
      if (isActive && tx !== undefined) {
        slot.translateX.value = slot.initialLeft.value + tx
      }
    }
  }
}

/**
 * Reduce slot opacity when inactive.
 * Use for visual feedback (e.g. dim non-active items).
 */
export function fadeWhenInactive(
  slot: HasOpacity & { isActive: { value: boolean } },
  activeOpacity = 1,
  inactiveOpacity = 0.5
): ReactionRule<boolean> {
  return {
    watch: () => {
      'worklet'
      return slot.isActive.value
    },
    apply: isActive => {
      'worklet'
      slot.opacity.value = isActive ? activeOpacity : inactiveOpacity
    }
  }
}

/**
 * Sync a target SharedNumber from a source SharedNumber.
 * Generic: works with any numeric SharedValue pair.
 */
export function syncValue(
  target: { value: number },
  source: { value: number }
): ReactionRule<number> {
  return {
    watch: () => {
      'worklet'
      return source.value
    },
    apply: v => {
      'worklet'
      target.value = v
    }
  }
}
