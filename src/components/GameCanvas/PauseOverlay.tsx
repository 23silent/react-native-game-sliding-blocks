import { Panel, SkiaButton, SkiaLabel, SkiaOverlay } from '../../core/skia'
import React from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { PAUSE_OVERLAY } from '../../model/layoutConsts'
import { fonts } from '../../utils/fonts'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'

const {
  BOX_WIDTH,
  BOX_HEIGHT,
  BUTTON_WIDTH,
  BUTTON_HEIGHT,
  BUTTON_GAP,
  FIRST_BUTTON_TOP
} = PAUSE_OVERLAY

type Props = {
  overlay: SharedValuesMap['overlay']
  gameWidth: number
  gameHeight: number
  showFinishOption: boolean
}

export function PauseOverlay({
  overlay,
  gameWidth,
  gameHeight,
  showFinishOption
}: Props): React.JSX.Element {
  const boxLeft = (gameWidth - BOX_WIDTH) / 2
  const boxTop = (gameHeight - BOX_HEIGHT) / 2
  const buttonLeft = (gameWidth - BUTTON_WIDTH) / 2

  const backdropColor = useDerivedValue(
    () => `rgba(0,0,0,${overlay.pauseOpacity.value * 0.75})`
  )
  const boxColor = useDerivedValue(
    () => `rgba(30,30,40,${overlay.pauseOpacity.value * 0.95})`
  )
  const buttonColor = useDerivedValue(
    () => `rgba(59,130,246,${overlay.pauseOpacity.value * 0.9})`
  )

  const resumeTop = boxTop + FIRST_BUTTON_TOP
  const restartTop = resumeTop + BUTTON_HEIGHT + BUTTON_GAP
  const finishTop = restartTop + BUTTON_HEIGHT + BUTTON_GAP

  return (
    <SkiaOverlay opacity={overlay.pauseOpacity}>
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
        x={boxLeft + (BOX_WIDTH - 80) / 2}
        y={boxTop + 40}
        text="Paused"
        font={fonts.title}
        color="white"
      />
      <SkiaButton
        x={buttonLeft}
        y={resumeTop}
        width={BUTTON_WIDTH}
        height={BUTTON_HEIGHT}
        r={10}
        color={buttonColor}
        label="Resume"
        labelX={buttonLeft + (BUTTON_WIDTH - 60) / 2}
        labelY={resumeTop + BUTTON_HEIGHT / 2 + 7}
        font={fonts.buttonSmall}
        textColor="white"
      />
      <SkiaButton
        x={buttonLeft}
        y={restartTop}
        width={BUTTON_WIDTH}
        height={BUTTON_HEIGHT}
        r={10}
        color={buttonColor}
        label="Restart"
        labelX={buttonLeft + (BUTTON_WIDTH - 54) / 2}
        labelY={restartTop + BUTTON_HEIGHT / 2 + 7}
        font={fonts.buttonSmall}
        textColor="white"
      />
      {showFinishOption && (
        <SkiaButton
          x={buttonLeft}
          y={finishTop}
          width={BUTTON_WIDTH}
          height={BUTTON_HEIGHT}
          r={10}
          color={buttonColor}
          label="Finish Game"
          labelX={buttonLeft + (BUTTON_WIDTH - 80) / 2}
          labelY={finishTop + BUTTON_HEIGHT / 2 + 7}
          font={fonts.buttonSmall}
          textColor="white"
        />
      )}
    </SkiaOverlay>
  )
}
