import { useRef } from 'react'
import { Easing, withSequence, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { BinderHook, useStreamBridge } from '../core/binding'
import { CELL_SIZE, KEYS } from '../model/consts'
import type { PathSegment } from '../model/types'
import { ItemViewModel } from '../viewmodels/ItemViewModel'
import type { IGameEngine } from '../viewmodels'
import { nop } from '../utils/nop'
import type { SharedValuesMap } from './useSharedValuesMap'

export type EngineBridgeOptions = {
  onCompleteEnd: (updated?: PathSegment[][]) => void
}

export function useEngineBridge(
  engine: IGameEngine,
  shared: SharedValuesMap,
  options: EngineBridgeOptions
): void {
  const { onCompleteEnd } = options
  const onCompleteEndRef = useRef(onCompleteEnd)
  onCompleteEndRef.current = onCompleteEnd

  useStreamBridge(
    disposeBag => {
      const onComplete = (updated?: PathSegment[][]) => {
        onCompleteEndRef.current(updated)
      }

    const rootAdapter = {
      onChangeItems$: engine.items$,
      activeItem$: engine.activeItem$,
      removeItem: (key: string) => engine.removeItem(key)
    }

    const itemViewModels = KEYS.reduce(
      (acc, key) => {
        acc[key] = new ItemViewModel(key, rootAdapter)
        return acc
      },
      {} as Record<string, ItemViewModel>
    )

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
      .bindAction(engine.onCompleteEnd$, ({ to, updated }) => {
        shared.translateX.value = withTiming(
          to * CELL_SIZE,
          { duration: 50, easing: Easing.ease },
          finished => finished && scheduleOnRN(onComplete, updated)
        )
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
          shared.overlay.opacity.value = withTiming(1, { duration: 250 })
        } else {
          shared.overlay.opacity.value = withTiming(0, { duration: 200 })
        }
      })
      .bindAction(engine.otherSubs$, nop)
      .disposeBy(disposeBag)

    KEYS.forEach(key => {
      const vm = itemViewModels[key]
      const slot = shared.items[key]
      const removeItem = () => engine.removeItem(key)

      BinderHook()
        .bindAction(vm.state$, st => {
          slot.translateX.value = st.xValue
          slot.translateY.value = withTiming(st.yValue, { duration: 200 })
          slot.opacity.value = st.opacityValue
          slot.width.value = st.widthValue
          slot.color.value = st.colorValue
          slot.initialLeft.value = st.xValue
        })
        .bindAction(vm.willRemoveTrigger$, () => {
          slot.opacity.value = withSequence(
            withTiming(0.5, { duration: 80 }),
            withTiming(1, { duration: 80 })
          )
        })
        .bindAction(vm.removeTrigger$, () => {
          slot.opacity.value = withTiming(0, { duration: 400 }, finished => {
            if (finished) scheduleOnRN(removeItem)
          })
        })
        .bindAction(vm.isActive$, value => {
          slot.isActive.value = value
        })
        .disposeBy(disposeBag)
    })
    },
    [engine]
  )
}
