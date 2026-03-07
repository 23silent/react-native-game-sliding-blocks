import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia'
import React, { memo } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { SkiaButton, SkiaLabel } from '../skia'
import { SCORE_BAR, SKIA_BUTTON_RADIUS, TOP_PAUSE } from '../layoutConsts'
import { fonts } from '../utils/fonts'
import { useSlidingBlocksContext } from '../SlidingBlocksContext'
import { useComposableSlidingBlocksContext } from '../ComposableSlidingBlocksContext'

const {
  HEIGHT: barHeight,
  PADDING_H: barPadding,
  PAUSE_GAP,
  STATS_GAP,
  STATS_RIGHT_GAP,
  PILL_PADDING,
  PILL_MIN_WIDTH
} = SCORE_BAR

/**
 * Standalone score bar - Skia Canvas. Use with useSlidingBlocks composable API.
 * Renders pause button, score pill, multiplier pill.
 */
export const ScoreBarCanvas = memo(function ScoreBarCanvas(): React.JSX.Element {
  const { theme } = useSlidingBlocksContext()
  const { shared, layout } = useComposableSlidingBlocksContext()

  const scoreText = useDerivedValue(() => `${Math.round(shared.score.value)}`)
  const multiplierText = useDerivedValue(
    () => `${Math.round(shared.multiplier.value)}`
  )

  const pauseLeft = layout.actionsBarLeft + TOP_PAUSE.LEFT_OFFSET
  const pauseTop = TOP_PAUSE.TOP_OFFSET
  const statsZoneLeft = pauseLeft + TOP_PAUSE.WIDTH + PAUSE_GAP
  const statsZoneRight =
    layout.actionsBarLeft + layout.actionsBarWidth - barPadding - STATS_RIGHT_GAP
  const statsZoneWidth = Math.max(0, statsZoneRight - statsZoneLeft)
  const pillWidth = Math.min(
    PILL_MIN_WIDTH,
    Math.max(0, (statsZoneWidth - STATS_GAP) / 2)
  )
  const scoreLeft = statsZoneLeft
  const multiplierLeft = scoreLeft + pillWidth + STATS_GAP
  const pillTop = (barHeight - 32) / 2
  const pillHeight = 32
  const pillRadius = 10
  const labelY = pillTop + 10
  const valueY = pillTop + 26
  const textLeft = PILL_PADDING

  const canvasHeight = layout.contentTop + barHeight

  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: canvasHeight,
        zIndex: 10
      }}
    >
      <RoundedRect
        x={layout.actionsBarLeft}
        y={layout.contentTop}
        width={layout.actionsBarWidth}
        height={barHeight}
        r={14}
      >
        <LinearGradient
          start={vec(0, 0)}
          end={vec(layout.actionsBarWidth, barHeight)}
          colors={theme.scoreBar.gradientColors}
        />
      </RoundedRect>
      <SkiaButton
        x={pauseLeft}
        y={layout.contentTop + pauseTop}
        width={TOP_PAUSE.WIDTH}
        height={TOP_PAUSE.HEIGHT}
        r={SKIA_BUTTON_RADIUS}
        color={theme.scoreBar.accentColor}
        label="Pause"
        labelX={pauseLeft + (TOP_PAUSE.WIDTH - 44) / 2}
        labelY={layout.contentTop + pauseTop + TOP_PAUSE.HEIGHT / 2 + 7}
        font={fonts.buttonSmall}
        textColor="white"
      />
      <RoundedRect
        x={scoreLeft}
        y={layout.contentTop + pillTop}
        width={pillWidth}
        height={pillHeight}
        r={pillRadius}
        color={theme.scoreBar.pillColor}
      />
      <SkiaLabel
        x={scoreLeft + textLeft}
        y={layout.contentTop + labelY}
        text="Score"
        font={fonts.label}
        color={theme.scoreBar.labelColor}
      />
      <SkiaLabel
        x={scoreLeft + textLeft}
        y={layout.contentTop + valueY}
        text={scoreText}
        font={fonts.score}
        color={theme.scoreBar.valueColor}
      />
      <RoundedRect
        x={multiplierLeft}
        y={layout.contentTop + pillTop}
        width={pillWidth}
        height={pillHeight}
        r={pillRadius}
        color={theme.scoreBar.multiplierPillColor}
      />
      <SkiaLabel
        x={multiplierLeft + textLeft}
        y={layout.contentTop + labelY}
        text="Multiplier"
        font={fonts.label}
        color={theme.scoreBar.labelColor}
      />
      <SkiaLabel
        x={multiplierLeft + textLeft}
        y={layout.contentTop + valueY}
        text={multiplierText}
        font={fonts.score}
        color={theme.scoreBar.valueColor}
      />
    </Canvas>
  )
})
