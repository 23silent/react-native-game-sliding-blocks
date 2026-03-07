import { Panel, SkiaButton, SkiaLabel, SkiaOverlay } from '../skia'
import React from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { GAME_OVER_OVERLAY } from '../layoutConsts'
import { fonts } from '../utils/fonts'
import type { SlidingBlocksTheme } from '../SlidingBlocks.types'
import type { SharedValuesMap } from '../../bridge'

const {
  BOX_WIDTH,
  BOX_HEIGHT,
  BUTTON_WIDTH,
  BUTTON_HEIGHT,
  BUTTON_TOP_OFFSET
} = GAME_OVER_OVERLAY

type Props = {
  overlay: SharedValuesMap['overlay']
  gameWidth: number
  gameHeight: number
  overlayTheme: SlidingBlocksTheme['overlay']
}

export function GameOverOverlay({
  overlay,
  gameWidth,
  gameHeight,
  overlayTheme
}: Props): React.JSX.Element {
  const boxLeft = (gameWidth - BOX_WIDTH) / 2
  const boxTop = (gameHeight - BOX_HEIGHT) / 2
  const buttonLeft = (gameWidth - BUTTON_WIDTH) / 2
  const buttonTop = gameHeight / 2 + BUTTON_TOP_OFFSET

  const scoreText = useDerivedValue(
    () => `Score: ${Math.round(overlay.gameOverScore.value)}`
  )
  const backdropColor = useDerivedValue(
    () =>
      `rgba(${overlayTheme.backdropRgb},${overlay.opacity.value * overlayTheme.backdropMaxAlpha})`
  )
  const boxColor = useDerivedValue(
    () =>
      `rgba(${overlayTheme.boxRgb},${overlay.opacity.value * overlayTheme.boxMaxAlpha})`
  )
  const buttonColor = useDerivedValue(
    () =>
      `rgba(${overlayTheme.accentRgb},${overlay.opacity.value * overlayTheme.accentMaxAlpha})`
  )

  return (
    <SkiaOverlay opacity={overlay.opacity}>
      <Panel
        x={0}
        y={0}
        width={gameWidth}
        height={gameHeight}
        r={0}
        color={backdropColor}
      />
      <Panel
        x={boxLeft}
        y={boxTop}
        width={BOX_WIDTH}
        height={BOX_HEIGHT}
        r={12}
        color={boxColor}
      />
      <SkiaLabel
        x={boxLeft + (BOX_WIDTH - 120) / 2}
        y={boxTop + 50}
        text="Game Over"
        font={fonts.title}
        color="white"
      />
      <SkiaLabel
        x={boxLeft + (BOX_WIDTH - 80) / 2}
        y={boxTop + 80}
        text={scoreText}
        font={fonts.scoreLarge}
        color="white"
      />
      <SkiaButton
        x={buttonLeft}
        y={buttonTop}
        width={BUTTON_WIDTH}
        height={BUTTON_HEIGHT}
        r={10}
        color={buttonColor}
        label="Restart"
        labelX={buttonLeft + (BUTTON_WIDTH - 50) / 2}
        labelY={buttonTop + BUTTON_HEIGHT / 2 + 8}
        font={fonts.button}
        textColor="white"
      />
    </SkiaOverlay>
  )
}
