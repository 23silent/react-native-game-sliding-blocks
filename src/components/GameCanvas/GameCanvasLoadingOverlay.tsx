import { Group, RoundedRect } from '@shopify/react-native-skia'
import React from 'react'

import { Panel, SkiaLabel } from '../../core/skia'
import { LOADING_OVERLAY } from '../../model/layoutConsts'
import { fonts } from '../../utils/fonts'

const {
  BOX_WIDTH,
  BOX_HEIGHT,
  BAR_HEIGHT,
  BAR_RADIUS,
  BAR_INSET
} = LOADING_OVERLAY

type Props = {
  screenWidth: number
  screenHeight: number
  progress: number
}

export function GameCanvasLoadingOverlay({
  screenWidth,
  screenHeight,
  progress
}: Props): React.JSX.Element {
  const boxLeft = (screenWidth - BOX_WIDTH) / 2
  const boxTop = (screenHeight - BOX_HEIGHT) / 2
  const barLeft = boxLeft + BAR_INSET
  const barTop = boxTop + BOX_HEIGHT - BAR_INSET - BAR_HEIGHT
  const barWidth = BOX_WIDTH - BAR_INSET * 2
  const fillWidth = Math.max(0, Math.min(1, progress)) * barWidth

  return (
    <Group>
      <Panel
        x={0}
        y={0}
        width={screenWidth}
        height={screenHeight}
        r={0}
        color="rgba(0,0,0,0.75)"
      />
      <Panel
        x={boxLeft}
        y={boxTop}
        width={BOX_WIDTH}
        height={BOX_HEIGHT}
        r={12}
        color="rgba(30,41,59,0.95)"
      />
      <SkiaLabel
        x={boxLeft + (BOX_WIDTH - 70) / 2}
        y={boxTop + 24}
        text="Loading..."
        font={fonts.title}
        color="white"
      />
      {/* Progress bar track */}
      <RoundedRect
        x={barLeft}
        y={barTop}
        width={barWidth}
        height={BAR_HEIGHT}
        r={BAR_RADIUS}
        color="rgba(15,23,42,0.9)"
      />
      {/* Progress bar fill */}
      {fillWidth > 0 && (
        <RoundedRect
          x={barLeft}
          y={barTop}
          width={fillWidth}
          height={BAR_HEIGHT}
          r={BAR_RADIUS}
          color="rgba(59,130,246,0.9)"
        />
      )}
    </Group>
  )
}
