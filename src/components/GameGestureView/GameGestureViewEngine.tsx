import React, { PropsWithChildren, useCallback, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { scheduleOnRN } from 'react-native-worklets'

import { GESTURE_SENSITIVITY } from '../../model/animConsts'
import type { IGameEngine } from '../../engine'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'
import type { GameLayout } from '../GameCanvas'

type GameGestureViewEngineProps = PropsWithChildren<{
  engine: IGameEngine
  shared: SharedValuesMap
  layout: GameLayout
  onTapOrRestart: (x: number, y: number) => boolean
}>

export const GameGestureViewEngine = ({
  children,
  engine,
  shared,
  layout,
  onTapOrRestart
}: GameGestureViewEngineProps) => {
  useEffect(() => {
    engine.setGestureContainerLayout({
      x: layout.gameAreaX,
      y: layout.gameAreaY
    })
  }, [engine, layout.gameAreaX, layout.gameAreaY])

  const handleTapOrRestart = useCallback(
    (x: number, y: number) => {
      if (!onTapOrRestart(x, y)) {
        engine.onGestureEnd(shared.translateX.value)
      }
    },
    [engine, onTapOrRestart, shared.translateX]
  )

  const handleGestureBegin = useCallback(
    (payload: { absoluteX: number; absoluteY: number }) => {
      engine.onGestureBegin(payload)
    },
    [engine]
  )

  const handleGestureEnd = useCallback(() => {
    engine.onGestureEnd(shared.translateX.value)
  }, [engine, shared.translateX])

  const tap = useMemo(
    () =>
      Gesture.Tap().onEnd(e =>
        scheduleOnRN(handleTapOrRestart, e.absoluteX, e.absoluteY)
      ),
    [handleTapOrRestart]
  )

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(e => {
          'worklet'
          if (shared.overlay.pauseOpacity.value > 0.5) return
          scheduleOnRN(handleGestureBegin, {
            absoluteX: e.absoluteX,
            absoluteY: e.absoluteY
          })
        })
        .onChange(e => {
          'worklet'
          if (shared.overlay.pauseOpacity.value > 0.5) return
          if (!shared.gesture.active.value) return
          const current = shared.translateX.value
          const minPx = shared.gesture.minPx.value
          const maxPx = shared.gesture.maxPx.value
          const raw = current + e.changeX * GESTURE_SENSITIVITY
          shared.translateX.value = Math.min(Math.max(raw, minPx), maxPx)
        })
        .onEnd(() => {
          'worklet'
          if (shared.overlay.pauseOpacity.value > 0.5) return
          scheduleOnRN(handleGestureEnd)
        }),
    [handleGestureBegin, handleGestureEnd, shared]
  )

  const gesture = useMemo(() => Gesture.Race(pan, tap), [pan, tap])

  return (
    <View style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={gesture}>{children}</GestureDetector>
    </View>
  )
}
