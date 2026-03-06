import {
  Canvas,
  Fill,
  Group,
  Image,
  LinearGradient,
  RoundedRect,
  useImage,
  vec
} from '@shopify/react-native-skia'

import { CheckerboardGrid, Panel, SkiaButton, SkiaLabel } from '../../core/skia'
import React, { memo, useEffect, useMemo, useState } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import {
  CELL_SIZE,
  COLUMNS_COUNT,
  EXPLOSION_POOL_SIZE,
  KEYS,
  ROWS_COUNT
} from '../../model/consts'
import { LOADING_OVERLAY, SCORE_BAR, TOP_RESTART } from '../../model/layoutConsts'
import { fonts } from '../../utils/fonts'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'
import { GameCanvasExplosion } from './GameCanvasExplosion'
import { GameCanvasLoadingOverlay } from './GameCanvasLoadingOverlay'
import { GameCanvasGhost } from './GameCanvasGhost'
import { GameCanvasIndicator } from './GameCanvasIndicator'
import { GameCanvasItem } from './GameCanvasItem'
import { GameOverOverlay } from './GameOverOverlay'
import type { BlockMap } from '../../model/types'

const GAME_WIDTH = CELL_SIZE * COLUMNS_COUNT
const GAME_HEIGHT = CELL_SIZE * ROWS_COUNT

export type GameLayout = {
  contentTop: number
  gameAreaX: number
  gameAreaY: number
  actionsBarLeft: number
  actionsBarWidth: number
}

type GameCanvasProps = {
  shared: SharedValuesMap
  layout: GameLayout
  block: BlockMap
  screenWidth: number
  screenHeight: number
}

const TOTAL_ASSETS = 7 * 4 + 1 // blocks (7 colors × 4 sizes) + bg

function countLoadedAssets(block: BlockMap, bgImage: unknown): number {
  let loaded = 0
  for (const color of Object.keys(block)) {
    for (let i = 0; i < 4; i++) {
      if (block[color]?.[i] != null) loaded++
    }
  }
  if (bgImage != null) loaded++
  return loaded
}

export const GameCanvas = memo(function GameCanvas({
  shared,
  layout,
  block,
  screenWidth,
  screenHeight
}: GameCanvasProps): React.JSX.Element {
  const bgImage = useImage(require('../../assets/bg.jpg'))

  const progress = useMemo(
    () => countLoadedAssets(block, bgImage) / TOTAL_ASSETS,
    [block, bgImage]
  )
  const isAssetsReady = progress >= 1

  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true)
  useEffect(() => {
    if (!isAssetsReady) return
    const t = setTimeout(
      () => setShowLoadingOverlay(false),
      LOADING_OVERLAY.MIN_DISPLAY_MS
    )
    return () => clearTimeout(t)
  }, [isAssetsReady])

  const scoreText = useDerivedValue(() => `${Math.round(shared.score.value)}`)
  const multiplierText = useDerivedValue(
    () => `${Math.round(shared.multiplier.value)}`
  )

  const {
    HEIGHT: barHeight,
    PADDING_H: barPadding,
    RESTART_GAP,
    STATS_GAP,
    PILL_PADDING,
    PILL_MIN_WIDTH
  } = SCORE_BAR

  const restartLeft = layout.actionsBarLeft + TOP_RESTART.LEFT_OFFSET
  const restartTop = TOP_RESTART.TOP_OFFSET
  const statsZoneLeft = restartLeft + TOP_RESTART.WIDTH + RESTART_GAP
  const statsZoneRight = layout.actionsBarLeft + layout.actionsBarWidth - barPadding
  const statsZoneWidth = Math.max(0, statsZoneRight - statsZoneLeft)
  const pillWidth = Math.max(
    PILL_MIN_WIDTH,
    (statsZoneWidth - STATS_GAP) / 2
  )
  const scoreLeft = statsZoneLeft
  const multiplierLeft = scoreLeft + pillWidth + STATS_GAP
  const pillTop = (barHeight - 32) / 2
  const pillHeight = 32
  const pillRadius = 10
  const labelY = pillTop + 10
  const valueY = pillTop + 26
  const textLeft = PILL_PADDING

  return (
    <Canvas style={{ flex: 1 }}>
      {bgImage ? (
        <Image
          image={bgImage}
          x={0}
          y={0}
          width={screenWidth}
          height={screenHeight}
          fit="cover"
        />
      ) : (
        <Fill color="rgba(200,200,200,0.5)" />
      )}
      <Fill color="rgba(255,255,255,0.3)" />
      <Group transform={[{ translateY: layout.contentTop }]}>
        {/* Score bar — gradient background with subtle glass effect */}
        <RoundedRect
          x={layout.actionsBarLeft}
          y={0}
          width={layout.actionsBarWidth}
          height={barHeight}
          r={14}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(layout.actionsBarWidth, barHeight)}
            colors={[
              'rgba(30,41,59,0.92)',
              'rgba(15,23,42,0.95)',
              'rgba(15,23,42,0.98)'
            ]}
          />
        </RoundedRect>
        <SkiaButton
          x={restartLeft}
          y={restartTop}
          width={TOP_RESTART.WIDTH}
          height={TOP_RESTART.HEIGHT}
          r={10}
          color="rgba(59,130,246,0.85)"
          label="Restart"
          labelX={restartLeft + (TOP_RESTART.WIDTH - 50) / 2}
          labelY={restartTop + TOP_RESTART.HEIGHT / 2 + 8}
          font={fonts.button}
          textColor="white"
        />
        {/* Center stats — Score and Multiplier pills (responsive width) */}
        <RoundedRect
          x={scoreLeft}
          y={pillTop}
          width={pillWidth}
          height={pillHeight}
          r={pillRadius}
          color="rgba(59,130,246,0.25)"
        />
        <SkiaLabel
          x={scoreLeft + textLeft}
          y={labelY}
          text="Score"
          font={fonts.label}
          color="rgba(203,213,225,0.9)"
        />
        <SkiaLabel
          x={scoreLeft + textLeft}
          y={valueY}
          text={scoreText}
          font={fonts.score}
          color="white"
        />
        <RoundedRect
          x={multiplierLeft}
          y={pillTop}
          width={pillWidth}
          height={pillHeight}
          r={pillRadius}
          color="rgba(168,85,247,0.2)"
        />
        <SkiaLabel
          x={multiplierLeft + textLeft}
          y={labelY}
          text="Multiplier"
          font={fonts.label}
          color="rgba(203,213,225,0.9)"
        />
        <SkiaLabel
          x={multiplierLeft + textLeft}
          y={valueY}
          text={multiplierText}
          font={fonts.score}
          color="white"
        />
      </Group>
      <Group
        transform={[
          { translateX: layout.gameAreaX },
          { translateY: layout.gameAreaY }
        ]}
      >
        <Panel
          x={0}
          y={0}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          r={10}
          color="transparent"
        />
        <CheckerboardGrid
          rows={ROWS_COUNT}
          cols={COLUMNS_COUNT}
          cellSize={CELL_SIZE}
        />
        {/* Indicator */}
        <GameCanvasIndicator
          indicator={shared.indicator}
          translateX={shared.translateX}
        />
        {/* Ghost */}
        <GameCanvasGhost ghost={shared.ghost} block={block} />
        {KEYS.map(key => (
          <GameCanvasItem
            key={key}
            slot={shared.items[key]}
            translateX={shared.translateX}
            block={block}
          />
        ))}
        {shared.explosionPool.map((slot, i) => (
          <GameCanvasExplosion key={i} slot={slot} />
        ))}
        {/* Game Over Overlay */}
        <GameOverOverlay
          overlay={shared.overlay}
          gameWidth={GAME_WIDTH}
          gameHeight={GAME_HEIGHT}
        />
      </Group>
      {/* Loading overlay — full screen, on top */}
      {showLoadingOverlay && (
        <GameCanvasLoadingOverlay
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          progress={progress}
        />
      )}
    </Canvas>
  )
})
