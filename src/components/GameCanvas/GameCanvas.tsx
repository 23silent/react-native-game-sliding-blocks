import {
  Canvas,
  Fill,
  Group,
  Image,
  LinearGradient,
  RoundedRect,
  rect,
  rrect,
  useImage,
  vec
} from '@shopify/react-native-skia'

import { CheckerboardGrid, Panel, SkiaButton, SkiaLabel } from '../../core/skia'
import React, { memo, useEffect, useMemo, useRef } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import {
  CELL_SIZE,
  COLUMNS_COUNT,
  EXPLOSION_POOL_SIZE,
  KEYS,
  ROWS_COUNT
} from '../../model/consts'
import {
  LOADING_OVERLAY,
  SCORE_BAR,
  TOP_PAUSE
} from '../../model/layoutConsts'
import { fonts } from '../../utils/fonts'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'
import { GameCanvasExplosion } from './GameCanvasExplosion'
import { GameCanvasGhost } from './GameCanvasGhost'
import { GameCanvasIndicator } from './GameCanvasIndicator'
import { GameCanvasItem } from './GameCanvasItem'
import { GameOverOverlay } from './GameOverOverlay'
import { PauseOverlay } from './PauseOverlay'
import type { BlockMap } from '../../model/types'

const glob = globalThis as unknown as {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
  clearIdleCallback?: (id: number) => void
}
const scheduleIdle =
  typeof glob.requestIdleCallback === 'function'
    ? (cb: () => void) => glob.requestIdleCallback!(cb, { timeout: 100 })
    : (cb: () => void) => setTimeout(cb, 0) as unknown as number
const cancelIdle =
  typeof glob.clearIdleCallback === 'function'
    ? (id: number) => glob.clearIdleCallback!(id)
    : (id: number) => clearTimeout(id)

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
  showFinishOption?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
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
  screenHeight,
  showFinishOption = false,
  onLoadProgress,
  onLoadComplete
}: GameCanvasProps): React.JSX.Element {
  const bgImage = useImage(require('../../assets/bg.jpg'))
  const completedRef = useRef(false)

  const progress = useMemo(
    () => countLoadedAssets(block, bgImage) / TOTAL_ASSETS,
    [block, bgImage]
  )
  const isAssetsReady = progress >= 1

  useEffect(() => {
    onLoadProgress?.(progress)
  }, [progress, onLoadProgress])

  const idleRef = useRef<number | null>(null)
  useEffect(() => {
    if (!isAssetsReady || !onLoadComplete || completedRef.current) return
    const t = setTimeout(() => {
      idleRef.current = scheduleIdle(() => {
        if (!completedRef.current) {
          completedRef.current = true
          onLoadComplete()
        }
      })
    }, LOADING_OVERLAY.MIN_DISPLAY_MS)
    return () => {
      clearTimeout(t)
      if (idleRef.current != null) {
        cancelIdle(idleRef.current)
        idleRef.current = null
      }
    }
  }, [isAssetsReady, onLoadComplete])

  const scoreText = useDerivedValue(() => `${Math.round(shared.score.value)}`)
  const multiplierText = useDerivedValue(
    () => `${Math.round(shared.multiplier.value)}`
  )

  const {
    HEIGHT: barHeight,
    PADDING_H: barPadding,
    PAUSE_GAP,
    STATS_GAP,
    STATS_RIGHT_GAP,
    PILL_PADDING,
    PILL_MIN_WIDTH
  } = SCORE_BAR

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
          x={pauseLeft}
          y={pauseTop}
          width={TOP_PAUSE.WIDTH}
          height={TOP_PAUSE.HEIGHT}
          r={10}
          color="rgba(59,130,246,0.85)"
          label="Pause"
          labelX={pauseLeft + (TOP_PAUSE.WIDTH - 44) / 2}
          labelY={pauseTop + TOP_PAUSE.HEIGHT / 2 + 7}
          font={fonts.buttonSmall}
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
        clip={rrect(rect(0, 0, GAME_WIDTH, GAME_HEIGHT), 16, 16)}
      >
        <Panel
          x={0}
          y={0}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          r={16}
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
        {/* Pause Overlay */}
        <PauseOverlay
          overlay={shared.overlay}
          gameWidth={GAME_WIDTH}
          gameHeight={GAME_HEIGHT}
          showFinishOption={showFinishOption}
        />
      </Group>
    </Canvas>
  )
})
