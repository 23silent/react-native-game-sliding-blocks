import { useRef } from 'react'
import { combineLatest } from 'rxjs'
import { startWith } from 'rxjs/operators'
import { Easing, withSequence, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { BinderHook } from '../engine/core/binding'
import { ANIM, SegmentState } from '../engine'
import type { PathSegmentExt } from '../engine'
import type { GameConfig } from '../config'
import type { IGameEngine } from '../engine'
import { nop } from '../engine/utils/nop'
import { useStreamBridge } from './useStreamBridge'
import type { GestureCompletionOrchestratorApi } from './GestureCompletionOrchestrator'
import type { SharedValuesMap } from './useSharedValuesMap'

export type RemovingPayload = { hasSuper: boolean }

export type EngineBridgeOptions = {
  orchestrator: GestureCompletionOrchestratorApi
  config: GameConfig
  onScoreChange?: (score: number) => void
  onGameOver?: (score: number) => void
  onRemovingStart?: (payload: RemovingPayload) => void
  onRemovingEnd?: (payload: RemovingPayload) => void
  onFitStart?: () => void
  onFitComplete?: (payload: { hadActualFit: boolean }) => void
}

function createItemToStateValue(config: GameConfig) {
  const { cellSize, rowsCount, keys } = config
  const initialStateValue = {
    yValue: rowsCount * cellSize,
    xValue: -1 * cellSize,
    opacityValue: 0,
    widthValue: 0,
    colorValue: '#fff',
    opacityControlledByAnimation: false
  }

  return function itemToStateValue(
    item: PathSegmentExt | undefined
  ): typeof initialStateValue & { opacityControlledByAnimation: boolean } {
    if (!item || item.state === SegmentState.Idle) return initialStateValue
    const isRemovingPhase =
      item.state === SegmentState.WillRemove ||
      item.state === SegmentState.Removing
    return {
      yValue: item.rowIndex * cellSize,
      xValue: item.start * cellSize,
      widthValue: (item.end - item.start) * cellSize,
      opacityValue: 0.8,
      colorValue: item.color,
      opacityControlledByAnimation: isRemovingPhase
    }
  }
}

export function useEngineBridge(
  engine: IGameEngine,
  shared: SharedValuesMap,
  options: EngineBridgeOptions
): void {
  const {
    orchestrator,
    config,
    onScoreChange,
    onGameOver,
    onRemovingStart,
    onRemovingEnd,
    onFitStart,
    onFitComplete
  } = options
  const { cellSize, keys, explosionPoolSize } = config
  const itemToStateValue = createItemToStateValue(config)
  const nextPoolIndexRef = useRef(0)
  const batchIdRef = useRef(0)
  const removingPendingRef = useRef(0)
  const removingHasSuperRef = useRef(false)

  useStreamBridge(
    disposeBag => {
      let prevItems: Partial<Record<string, PathSegmentExt>> = {}

      BinderHook()
        .bindAction(engine.score$, v => {
          shared.score.value = v
          onScoreChange?.(v)
        })
        .bindAction(engine.multiplier$, v => {
          shared.multiplier.value = v
        })
        .bindAction(engine.onChangeTranslateX$, v => {
          shared.translateX.value = v
        })
        .bindAction(engine.gestureBounds$, bounds => {
          if (bounds) {
            shared.gesture.active.value = true
            shared.gesture.minPx.value = bounds.minPx
            shared.gesture.maxPx.value = bounds.maxPx
          } else {
            shared.gesture.active.value = false
          }
        })
        .bindAction(engine.onCompleteEnd$, ({ to, updated }) => {
          onFitStart?.()
          orchestrator.providePipelineResult({ to, updated })
          const hadActualFit = !!updated
          const targetPx = to * cellSize
          const onSnapDone = () => {
            onFitComplete?.({ hadActualFit })
            orchestrator.onSnapAnimationComplete()
          }
          if (to === 0) {
            shared.translateX.value = 0
            scheduleOnRN(onSnapDone)
          } else {
            shared.translateX.value = withTiming(
              targetPx,
              {
                duration: ANIM.COMPLETE_SNAP,
                easing: Easing.ease
              },
              finished => finished && scheduleOnRN(onSnapDone)
            )
          }
        })
        .bindAction(engine.activeItem$, item => {
          shared.indicator.width.value = item ? item.width : -1
          shared.indicator.left.value = item ? item.left : -1
          shared.indicator.opacity.value = withTiming(item ? 0.1 : 0)
          if (item) {
            shared.ghost.color.value = item.color
            shared.ghost.translateX.value = item.left
            shared.ghost.translateY.value = item.top
            shared.ghost.opacity.value = 0.4
            shared.ghost.width.value = item.width
          } else {
            shared.ghost.color.value = 'transparent'
            shared.ghost.translateX.value = -1
            shared.ghost.translateY.value = -1
            shared.ghost.opacity.value = 0
            shared.ghost.width.value = 0
          }
        })
        .bindAction(engine.gameOver$, value => {
          if (value) {
            onGameOver?.(value.score)
            shared.overlay.gameOverScore.value = value.score
            shared.overlay.opacity.value = withTiming(1, {
              duration: ANIM.GAME_OVER_IN
            })
          } else {
            shared.overlay.opacity.value = withTiming(
              0,
              { duration: ANIM.GAME_OVER_OUT },
              finished =>
                finished && scheduleOnRN(orchestrator.onOverlayFadeOutComplete)
            )
          }
        })
        /* Subscribe to activate gesture pipeline (change/end side effects) */
        .bindAction(engine.gesturePipeline$, nop)
        .disposeBy(disposeBag)

      /* Consolidated items$ + activeItem$ subscription - animation completion driven */
      const itemsSub = combineLatest([
        engine.items$,
        engine.activeItem$.pipe(startWith(undefined))
      ]).subscribe(([items, activeItem]) => {
        batchIdRef.current += 1
        const thisBatch = batchIdRef.current
        let pending = 0
        let willRemoveHasSuper = false

        const onComplete = () => {
          if (batchIdRef.current !== thisBatch) return
          pending -= 1
          if (pending <= 0) {
            engine.signalStepComplete()
          }
        }

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i]
          const slot = shared.items[key]
          if (!slot) continue
          const item = items[key]
          const prevItem = prevItems[key]
          const st = itemToStateValue(item)
          const isActiveSlot =
            !!activeItem && !!item && activeItem.id === item.id

          if (!isActiveSlot) {
            slot.translateX.value = st.xValue
            slot.initialLeft.value = st.xValue
          }
          pending += 1
          slot.translateY.value = withTiming(
            st.yValue,
            { duration: ANIM.ITEM_DROP },
            finished => finished && scheduleOnRN(onComplete)
          )
          slot.width.value = st.widthValue
          slot.color.value = st.colorValue
          slot.isActive.value = isActiveSlot

          const wasWillRemove = prevItem?.state === SegmentState.WillRemove
          const isWillRemove = item?.state === SegmentState.WillRemove
          const wasRemoving = prevItem?.state === SegmentState.Removing
          const isRemoving = item?.state === SegmentState.Removing

          if (!wasWillRemove && isWillRemove) {
            willRemoveHasSuper = willRemoveHasSuper || !!item?.super
            pending += 1
            slot.opacity.value = withSequence(
              withTiming(0.85, { duration: ANIM.WILL_REMOVE_PULSE }),
              withTiming(
                1,
                { duration: ANIM.WILL_REMOVE_PULSE },
                finished => finished && scheduleOnRN(onComplete)
              )
            )
          } else if (!wasRemoving && isRemoving) {
            removingHasSuperRef.current =
              removingHasSuperRef.current || !!item?.super
            removingPendingRef.current += 1
            const onRemoveDone = () => {
              if (batchIdRef.current !== thisBatch) return
              removingPendingRef.current -= 1
              if (removingPendingRef.current <= 0) {
                onRemovingEnd?.({
                  hasSuper: removingHasSuperRef.current
                })
                removingHasSuperRef.current = false
              }
            }
            /* Don't wait for remove animation - pipeline advances immediately */
            engine.removeItem(key)
            const cellCount = Math.max(
              1,
              Math.round(slot.width.value / cellSize)
            )
            const colorVal = slot.color.value
            const baseX = slot.translateX.value
            const baseY = slot.translateY.value

            for (let c = 0; c < cellCount; c++) {
              const poolIndex = nextPoolIndexRef.current % explosionPoolSize
              nextPoolIndexRef.current += 1
              const poolSlot = shared.explosionPool[poolIndex]
              poolSlot.centerX.value = baseX + (c + 0.5) * cellSize
              poolSlot.centerY.value = baseY + cellSize / 2
              poolSlot.color.value = colorVal
              poolSlot.progress.value = 0
              poolSlot.progress.value = withTiming(1, {
                duration: ANIM.REMOVE_FADE
              })
            }
            slot.opacity.value = withTiming(
              0,
              { duration: ANIM.REMOVE_FADE },
              finished => finished && scheduleOnRN(onRemoveDone)
            )
          } else if (!st.opacityControlledByAnimation) {
            slot.opacity.value = st.opacityValue
          }
        }

        const anyWillRemove = keys.some(key => {
          const item = items[key]
          const prev = prevItems[key]
          return (
            item?.state === SegmentState.WillRemove &&
            prev?.state !== SegmentState.WillRemove
          )
        })
        if (anyWillRemove) {
          onRemovingStart?.({ hasSuper: willRemoveHasSuper })
        }
        prevItems = items

        if (pending <= 0) {
          engine.signalStepComplete()
        }
      })
      disposeBag.add(itemsSub)
    },
    [engine, config]
  )
}
