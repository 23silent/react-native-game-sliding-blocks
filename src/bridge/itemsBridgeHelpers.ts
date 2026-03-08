/**
 * Helpers for the items$ subscription in useEngineBridge.
 * Extracted for readability - each function handles one animation/state transition.
 */

import { withSequence, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import type { GameConfig } from '../config'
import type { PathSegmentExt } from '../engine'
import { SegmentState } from '../engine'
import type { AnimationSettings, FeedbackOpacitySettings } from '../types/settings'
import type {
  ExplosionPoolSlotSharedValues,
  ItemSlotSharedValues,
  SharedValuesMap} from './useSharedValuesMap'

export type ItemToStateValue = {
  yValue: number
  xValue: number
  opacityValue: number
  widthValue: number
  colorValue: string
  opacityControlledByAnimation: boolean
}

export function createItemToStateValue(
  config: GameConfig,
  feedback: FeedbackOpacitySettings
): (item: PathSegmentExt | undefined) => ItemToStateValue {
  const { cellSize, rowsCount } = config
  const blockIdle = feedback.blockIdle
  const initialStateValue: ItemToStateValue = {
    yValue: rowsCount * cellSize,
    xValue: -1 * cellSize,
    opacityValue: 0,
    widthValue: 0,
    colorValue: '#fff',
    opacityControlledByAnimation: false
  }

  return function itemToStateValue(
    item: PathSegmentExt | undefined
  ): ItemToStateValue {
    if (!item || item.state === SegmentState.Idle) return initialStateValue
    const isRemovingPhase =
      item.state === SegmentState.WillRemove ||
      item.state === SegmentState.Removing
    return {
      yValue: item.rowIndex * cellSize,
      xValue: item.start * cellSize,
      widthValue: (item.end - item.start) * cellSize,
      opacityValue: blockIdle,
      colorValue: item.color,
      opacityControlledByAnimation: isRemovingPhase
    }
  }
}

type RefLike<T> = { current: T }

type BatchContext = {
  pendingCounter: RefLike<number>
  onComplete: () => void
}

export function applySlotBaseUpdates(
  slot: ItemSlotSharedValues,
  st: ItemToStateValue,
  isActiveSlot: boolean,
  ctx: BatchContext,
  anim: AnimationSettings
): void {
  const { onComplete } = ctx
  ctx.pendingCounter.current += 1

  if (!isActiveSlot) {
    slot.translateX.value = st.xValue
    slot.initialLeft.value = st.xValue
  }

  slot.translateY.value = withTiming(
    st.yValue,
    { duration: anim.itemDropMs },
    finished => finished && scheduleOnRN(onComplete)
  )
  slot.width.value = st.widthValue
  slot.color.value = st.colorValue
  slot.isActive.value = isActiveSlot
}

export function applyWillRemovePulse(
  slot: ItemSlotSharedValues,
  ctx: BatchContext,
  anim: AnimationSettings,
  feedback: FeedbackOpacitySettings
): void {
  const { onComplete } = ctx
  ctx.pendingCounter.current += 1
  slot.opacity.value = withSequence(
    withTiming(feedback.willRemovePulseMin, { duration: anim.willRemovePulseMs }),
    withTiming(
      1,
      { duration: anim.willRemovePulseMs },
      finished => finished && scheduleOnRN(onComplete)
    )
  )
}

export function applyRemovingAnimation(
  key: string,
  slot: ItemSlotSharedValues,
  item: PathSegmentExt,
  shared: SharedValuesMap,
  cellSize: number,
  explosionPoolSize: number,
  nextPoolIndexRef: RefLike<number>,
  removingPendingRef: RefLike<number>,
  removingHasSuperRef: RefLike<boolean>,
  thisBatch: number,
  batchIdRef: RefLike<number>,
  engine: { removeItem: (k: string) => void },
  anim: AnimationSettings,
  onRemovingEnd?: (payload: { hasSuper: boolean }) => void
): void {
  removingHasSuperRef.current = removingHasSuperRef.current || !!item?.super
  removingPendingRef.current += 1

  const onRemoveDone = () => {
    if (batchIdRef.current !== thisBatch) return
    removingPendingRef.current -= 1
    if (removingPendingRef.current <= 0) {
      onRemovingEnd?.({ hasSuper: removingHasSuperRef.current })
      removingHasSuperRef.current = false
    }
  }

  engine.removeItem(key)

  const cellCount = Math.max(1, Math.round(slot.width.value / cellSize))
  const colorVal = slot.color.value
  const baseX = slot.translateX.value
  const baseY = slot.translateY.value

  for (let c = 0; c < cellCount; c++) {
    const poolIndex = nextPoolIndexRef.current % explosionPoolSize
    nextPoolIndexRef.current += 1
    const poolSlot: ExplosionPoolSlotSharedValues =
      shared.explosionPool[poolIndex]
    poolSlot.centerX.value = baseX + (c + 0.5) * cellSize
    poolSlot.centerY.value = baseY + cellSize / 2
    poolSlot.color.value = colorVal
    poolSlot.progress.value = 0
    poolSlot.progress.value = withTiming(1, {
      duration: anim.removeExplosionMs
    })
  }

  slot.opacity.value = withTiming(
    0,
    { duration: anim.removeFadeMs },
    finished => finished && scheduleOnRN(onRemoveDone)
  )
}
