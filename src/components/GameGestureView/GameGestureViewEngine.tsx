import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'

import type { IGameEngine } from '../../engine'
import type { GameLayout } from '../GameCanvas'

type GameGestureViewEngineProps = PropsWithChildren<{
  engine: IGameEngine
  layout: GameLayout
  onTapOrRestart: (x: number, y: number) => boolean
}>

export const GameGestureViewEngine = ({
  children,
  engine,
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
        engine.onGestureEnd()
      }
    },
    [engine, onTapOrRestart]
  )

  const handleGestureBegin = useCallback(
    (payload: { absoluteX: number; absoluteY: number }) => {
      engine.onGestureBegin(payload)
    },
    [engine]
  )

  const handleGestureChange = useCallback((payload: { changeX: number }) => {
    engine.onGestureChange(payload)
  }, [engine])

  const handleGestureEnd = useCallback(() => {
    engine.onGestureEnd()
  }, [engine])

  const tap = Gesture.Tap().onEnd(e =>
    runOnJS(handleTapOrRestart)(e.absoluteX, e.absoluteY)
  )
  const pan = Gesture.Pan()
    .onBegin(e =>
      runOnJS(handleGestureBegin)({
        absoluteX: e.absoluteX,
        absoluteY: e.absoluteY
      })
    )
    .onChange(e => runOnJS(handleGestureChange)({ changeX: e.changeX }))
    .onEnd(() => runOnJS(handleGestureEnd)())

  const gesture = Gesture.Race(pan, tap)

  return (
    <View style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={gesture}>{children}</GestureDetector>
    </View>
  )
}
