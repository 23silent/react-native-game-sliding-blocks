import { Canvas } from '@shopify/react-native-skia'
import React, { PropsWithChildren, useEffect, useState } from 'react'
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  Easing,
  SharedValue,
  withTiming
} from 'react-native-reanimated'

import { CELL_SIZE } from '../../consts'
import { PathSegment } from '../../types'
import { nop } from '../../utils/nop'
import { BinderHook, DisposeBag } from '../../utils/rx'
import { GameOverOverlay, hitTestRestart } from '../GameOverOverlay'
import { RootViewModel } from '../GameRootView/viewModel'
import { ViewModel } from './viewModel'
import { scheduleOnRN } from 'react-native-worklets'

type GameGestureViewProps = PropsWithChildren<{
  translateX: SharedValue<number>
  style?: StyleProp<ViewStyle>
  rootViewModel: RootViewModel
}>

export const GameGestureView = ({
  children,
  translateX,
  style,
  rootViewModel
}: GameGestureViewProps) => {
  const [viewModel] = useState(() => new ViewModel(rootViewModel))

  const onBegin = viewModel.onBegin
  const onChange = viewModel.onChange
  const onEnd = viewModel.onEnd

  const onCompleteEnd = (updated: PathSegment[][] | undefined) => {
    rootViewModel.setActiveItem(undefined)
    viewModel.onAnimationFinish()
    if (updated) rootViewModel.onCompleteGesture(updated)
  }

  const handleTapOrRestart = (x: number, y: number) => {
    const gameOver = rootViewModel.getGameOver()
    if (gameOver && hitTestRestart(x, y)) {
      rootViewModel.restart()
      return
    }
    onEnd()
  }

  useEffect(() => {
    const disposeBag = new DisposeBag()
    BinderHook()
      .bindAction(viewModel.onChangeTranslateX$, value => {
        translateX.value = value
      })
      .bindAction(viewModel.onCompleteEnd$, ({ to, updated }) => {
        translateX.value = withTiming(
          to * CELL_SIZE,
          { duration: 50, easing: Easing.ease },
          finished => finished && scheduleOnRN(onCompleteEnd, updated)
        )
      })
      .bindAction(viewModel.otherSubs$, nop)
      .disposeBy(disposeBag)

    return () => disposeBag.dispose()
  }, [])

  const tap = Gesture.Tap().onEnd(e =>
    scheduleOnRN(handleTapOrRestart, e.x, e.y)
  )
  const pan = Gesture.Pan()
    .onBegin(e => scheduleOnRN(onBegin, e))
    .onChange(e => scheduleOnRN(onChange, e))
    .onEnd(() => scheduleOnRN(onEnd))

  const gesture = Gesture.Race(pan, tap)

  const onLayout = (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y
    setTimeout(() => viewModel.setContainerLayout({ y }), 0)
  }

  return (
    <GestureDetector gesture={gesture}>
      <View onLayout={onLayout} style={style}>
        <Canvas style={{ flex: 1 }}>
          {children}
          <GameOverOverlay rootViewModel={rootViewModel} />
        </Canvas>
      </View>
    </GestureDetector>
  )
}
