import {
  Group,
  RoundedRect,
  Skia,
  Text,
  matchFont
} from '@shopify/react-native-skia'
import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import {
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { CELL_SIZE, COLUMNS_COUNT, ROWS_COUNT } from '../../consts'
import { BinderHook, DisposeBag } from '../../utils/rx'
import { RootViewModel } from '../GameRootView/viewModel'

const WIDTH = CELL_SIZE * COLUMNS_COUNT
const HEIGHT = CELL_SIZE * ROWS_COUNT
const BOX_WIDTH = 220
const BOX_HEIGHT = 140
const BUTTON_WIDTH = 140
const BUTTON_HEIGHT = 44

export const GAME_OVER_RESTART_BOUNDS = {
  left: WIDTH / 2 - BUTTON_WIDTH / 2,
  right: WIDTH / 2 + BUTTON_WIDTH / 2,
  top: HEIGHT / 2 + 20,
  bottom: HEIGHT / 2 + 20 + BUTTON_HEIGHT
}

export const hitTestRestart = (x: number, y: number): boolean => {
  const { left, right, top, bottom } = GAME_OVER_RESTART_BOUNDS
  return x >= left && x <= right && y >= top && y <= bottom
}

type Props = {
  rootViewModel: RootViewModel
}

const fontFamily = Platform.select({
  ios: 'Helvetica',
  default: 'sans-serif'
})
const scoreFont = matchFont({ fontFamily, fontSize: 20 })
const titleFont = matchFont({
  fontFamily,
  fontSize: 28,
  fontWeight: '700'
})
const restartFont = matchFont({
  fontFamily,
  fontSize: 18,
  fontWeight: '600'
})

export const GameOverOverlay = ({ rootViewModel }: Props): React.JSX.Element => {
  const overlayOpacity = useSharedValue(0)
  const gameOverScore = useSharedValue(0)

  useEffect(() => {
    const disposeBag = new DisposeBag()
    BinderHook()
      .bindAction(rootViewModel.gameOver$, value => {
        if (value) {
          gameOverScore.value = value.score
          overlayOpacity.value = withTiming(1, { duration: 250 })
        } else {
          overlayOpacity.value = withTiming(0, { duration: 200 })
        }
      })
      .disposeBy(disposeBag)
    return () => disposeBag.dispose()
  }, [])

  const scoreText = useDerivedValue(
    () => `Score: ${Math.round(gameOverScore.value)}`
  )

  const backdropColor = useDerivedValue(
    () => `rgba(0,0,0,${overlayOpacity.value * 0.75})`
  )

  const boxColor = useDerivedValue(
    () => `rgba(30,30,40,${overlayOpacity.value * 0.95})`
  )
  const buttonColor = useDerivedValue(
    () => `rgba(59,130,246,${overlayOpacity.value * 0.9})`
  )

  const boxLeft = (WIDTH - BOX_WIDTH) / 2
  const boxTop = (HEIGHT - BOX_HEIGHT) / 2
  const buttonLeft = (WIDTH - BUTTON_WIDTH) / 2
  const buttonTop = HEIGHT / 2 + 20

  return (
    <Group opacity={overlayOpacity}>
      <RoundedRect
        x={0}
        y={0}
        width={WIDTH}
        height={HEIGHT}
        r={0}
        color={backdropColor}
      />
      <RoundedRect
        x={boxLeft}
        y={boxTop}
        width={BOX_WIDTH}
        height={BOX_HEIGHT}
        r={12}
        color={boxColor}
      />
      <Text
        text="Game Over"
        font={titleFont}
        x={boxLeft + (BOX_WIDTH - 120) / 2}
        y={boxTop + 50}
        color={Skia.Color('white')}
      />
      <Text
        text={scoreText}
        font={scoreFont}
        x={boxLeft + (BOX_WIDTH - 80) / 2}
        y={boxTop + 80}
        color={Skia.Color('white')}
      />
      <RoundedRect
        x={buttonLeft}
        y={buttonTop}
        width={BUTTON_WIDTH}
        height={BUTTON_HEIGHT}
        r={10}
        color={buttonColor}
      />
      <Text
        text="Restart"
        font={restartFont}
        x={buttonLeft + (BUTTON_WIDTH - 50) / 2}
        y={buttonTop + BUTTON_HEIGHT / 2 + 8}
        color={Skia.Color('white')}
      />
    </Group>
  )
}
