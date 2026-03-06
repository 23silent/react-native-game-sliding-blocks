import { useRef } from 'react'
import { combineLatest } from 'rxjs'
import { startWith } from 'rxjs/operators'
import { Easing, withSequence, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { BinderHook, useStreamBridge } from '../core/binding'
import { ANIM } from '../model/animConsts'
import type { PathSegment } from '../model/types'
import { SegmentState } from '../model/types'
import type { PathSegmentExt } from '../model/types'
import type { GameConfig } from '../settings/gameConfig'
import type { IGameEngine } from '../viewmodels'
import { nop } from '../utils/nop'
import type { GestureCompletionOrchestratorApi } from './GestureCompletionOrchestrator'
import type { SharedValuesMap } from './useSharedValuesMap'

export type EngineBridgeOptions = {
  orchestrator: GestureCompletionOrchestratorApi
  config: GameConfig
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
  const { orchestrator, config } = options
  const { cellSize, keys, explosionPoolSize } = config
  const itemToStateValue = createItemToStateValue(config)
  const nextPoolIndexRef = useRef(0)
  const batchIdRef = useRef(0)

  useStreamBridge(
    disposeBag => {
      let prevItems: Partial<Record<string, PathSegmentExt>> = {}

      BinderHook()
        .bindAction(engine.score$, v => {
          shared.score.value = v
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
          orchestrator.providePipelineResult({ to, updated })
          const targetPx = to * cellSize
          if (to === 0) {
            shared.translateX.value = 0
            orchestrator.onSnapAnimationComplete()
          } else {
            shared.translateX.value = withTiming(
              targetPx,
              {
                duration: ANIM.COMPLETE_SNAP,
                easing: Easing.ease
              },
              finished =>
                finished && scheduleOnRN(orchestrator.onSnapAnimationComplete)
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
            slot.opacity.value = withTiming(0, { duration: ANIM.REMOVE_FADE })
          } else if (!st.opacityControlledByAnimation) {
            slot.opacity.value = st.opacityValue
          }
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
