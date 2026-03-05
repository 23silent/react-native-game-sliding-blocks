import { Group, RoundedRect, Skia, Text } from '@shopify/react-native-skia'
import React from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { fonts } from '../../utils/fonts'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'

const BOX_WIDTH = 220
const BOX_HEIGHT = 140
const BUTTON_WIDTH = 140
const BUTTON_HEIGHT = 44

type Props = {
  overlay: SharedValuesMap['overlay']
  gameWidth: number
  gameHeight: number
}

export function GameOverOverlay({
  overlay,
  gameWidth,
  gameHeight
}: Props): React.JSX.Element {
  const boxLeft = (gameWidth - BOX_WIDTH) / 2
  const boxTop = (gameHeight - BOX_HEIGHT) / 2
  const buttonLeft = (gameWidth - BUTTON_WIDTH) / 2
  const buttonTop = gameHeight / 2 + 20

  const scoreText = useDerivedValue(
    () => `Score: ${Math.round(overlay.gameOverScore.value)}`
  )
  const backdropColor = useDerivedValue(
    () => `rgba(0,0,0,${overlay.opacity.value * 0.75})`
  )
  const boxColor = useDerivedValue(
    () => `rgba(30,30,40,${overlay.opacity.value * 0.95})`
  )
  const buttonColor = useDerivedValue(
    () => `rgba(59,130,246,${overlay.opacity.value * 0.9})`
  )

  return (
    <Group opacity={overlay.opacity}>
      <RoundedRect
        x={0}
        y={0}
        width={gameWidth}
        height={gameHeight}
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
        font={fonts.title}
        x={boxLeft + (BOX_WIDTH - 120) / 2}
        y={boxTop + 50}
        color={Skia.Color('white')}
      />
      <Text
        text={scoreText}
        font={fonts.scoreLarge}
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
        font={fonts.button}
        x={buttonLeft + (BUTTON_WIDTH - 50) / 2}
        y={buttonTop + BUTTON_HEIGHT / 2 + 8}
        color={Skia.Color('white')}
      />
    </Group>
  )
}
