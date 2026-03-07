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

import { CheckerboardGrid, Panel, SkiaButton, SkiaLabel } from '../skia'
import React, { memo, useEffect, useMemo, useRef } from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import type { GameConfig } from '../../config'
import {
  LOADING_OVERLAY,
  SCORE_BAR,
  SKIA_BUTTON_RADIUS,
  TOP_PAUSE
} from '../layoutConsts'
import { fonts } from '../utils/fonts'
import { useSlidingBlocksContext } from '../SlidingBlocksContext'
import type { SharedValuesMap } from '../../bridge'
import { GameCanvasExplosion } from './GameCanvasExplosion'
import { GameCanvasGhost } from './GameCanvasGhost'
import { GameCanvasIndicator } from './GameCanvasIndicator'
import { GameCanvasItem } from './GameCanvasItem'
import { GameOverOverlay } from './GameOverOverlay'
import { PauseOverlay } from './PauseOverlay'
import type { BlockMap } from '../../engine'
import type { ImageSource } from '../SlidingBlocks.types'
import { scheduleIdle, cancelIdle } from '../utils/scheduleIdle'

export type GameLayout = {
  contentTop: number
  gameAreaX: number
  gameAreaY: number
  actionsBarLeft: number
  actionsBarWidth: number
}

export type BlockRenderMode = 'image' | 'skia'

type GameCanvasProps = {
  shared: SharedValuesMap
  layout: GameLayout
  config: GameConfig
  block: BlockMap
  screenWidth: number
  screenHeight: number
  /** Optional. Omit for solid color fallback. */
  backgroundImage?: ImageSource | null
  showFinishOption?: boolean
  blockRenderMode?: BlockRenderMode
  /** True when block has no image assets (use skia drawing). */
  hasBlockImages?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

function countLoadedAssets(
  block: BlockMap,
  bgImage: unknown,
  hasBlockImages: boolean,
  blockRenderMode: BlockRenderMode,
  totalAssets: number
): number {
  let loaded = 0
  if (hasBlockImages && blockRenderMode === 'image') {
    for (const color of Object.keys(block)) {
      for (let i = 0; i < 4; i++) {
        if (block[color]?.[i] != null) loaded++
      }
    }
  }
  if (bgImage != null) loaded++
  return totalAssets <= 1 && loaded === 0 ? 1 : loaded
}

export const GameCanvas = memo(function GameCanvas({
  shared,
  layout,
  config,
  block,
  screenWidth,
  screenHeight,
  backgroundImage,
  showFinishOption = false,
  blockRenderMode = 'image',
  hasBlockImages = true,
  onLoadProgress,
  onLoadComplete
}: GameCanvasProps): React.JSX.Element {
  const { theme, settings } = useSlidingBlocksContext()
  const {
    cellSize,
    gameWidth,
    gameHeight,
    rowsCount,
    columnsCount,
    keys
  } = config
  const bgImage = useImage(
    (backgroundImage ?? undefined) as Parameters<typeof useImage>[0]
  )
  const completedRef = useRef(false)
  const useSkiaDrawing =
    blockRenderMode === 'skia' || !hasBlockImages
  const totalAssets = useMemo(() => {
    const blockCount =
      hasBlockImages && blockRenderMode === 'image' ? 7 * 4 : 0
    const bgCount = backgroundImage != null ? 1 : 0
    return Math.max(1, blockCount + bgCount)
  }, [hasBlockImages, blockRenderMode, backgroundImage])

  const progress = useMemo(
    () =>
      countLoadedAssets(
        block,
        bgImage,
        hasBlockImages,
        blockRenderMode,
        totalAssets
      ) / totalAssets,
    [block, bgImage, hasBlockImages, blockRenderMode, totalAssets]
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
            colors={theme.scoreBar.gradientColors}
          />
        </RoundedRect>
        <SkiaButton
          x={pauseLeft}
          y={pauseTop}
          width={TOP_PAUSE.WIDTH}
          height={TOP_PAUSE.HEIGHT}
          r={SKIA_BUTTON_RADIUS}
          color={theme.scoreBar.accentColor}
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
          color={theme.scoreBar.pillColor}
        />
        <SkiaLabel
          x={scoreLeft + textLeft}
          y={labelY}
          text="Score"
          font={fonts.label}
          color={theme.scoreBar.labelColor}
        />
        <SkiaLabel
          x={scoreLeft + textLeft}
          y={valueY}
          text={scoreText}
          font={fonts.score}
          color={theme.scoreBar.valueColor}
        />
        <RoundedRect
          x={multiplierLeft}
          y={pillTop}
          width={pillWidth}
          height={pillHeight}
          r={pillRadius}
          color={theme.scoreBar.multiplierPillColor}
        />
        <SkiaLabel
          x={multiplierLeft + textLeft}
          y={labelY}
          text="Multiplier"
          font={fonts.label}
          color={theme.scoreBar.labelColor}
        />
        <SkiaLabel
          x={multiplierLeft + textLeft}
          y={valueY}
          text={multiplierText}
          font={fonts.score}
          color={theme.scoreBar.valueColor}
        />
      </Group>
      <Group
        transform={[
          { translateX: layout.gameAreaX },
          { translateY: layout.gameAreaY }
        ]}
        clip={rrect(rect(0, 0, gameWidth, gameHeight), 16, 16)}
      >
        <Panel
          x={0}
          y={0}
          width={gameWidth}
          height={gameHeight}
          r={16}
          color="transparent"
        />
        <CheckerboardGrid
          rows={rowsCount}
          cols={columnsCount}
          cellSize={cellSize}
          checkerboard={settings.checkerboard}
        />
        {/* Indicator */}
        <GameCanvasIndicator
          indicator={shared.indicator}
          translateX={shared.translateX}
          cellSize={cellSize}
          rowsCount={rowsCount}
        />
        {/* Ghost */}
        <GameCanvasGhost
          ghost={shared.ghost}
          block={block}
          cellSize={cellSize}
          useSkiaDrawing={useSkiaDrawing}
          blockSettings={settings.block}
          blockTheme={theme.block}
        />
        {keys.map(key => (
          <GameCanvasItem
            key={key}
            slot={shared.items[key]}
            translateX={shared.translateX}
            block={block}
            cellSize={cellSize}
            useSkiaDrawing={useSkiaDrawing}
            blockSettings={settings.block}
            blockTheme={theme.block}
          />
        ))}
        {shared.explosionPool.map((slot, i) => (
          <GameCanvasExplosion
            key={i}
            slot={slot}
            slotIndex={i}
            explosion={settings.explosion}
            explosionPresets={settings.explosionPresets}
          />
        ))}
        {/* Game Over Overlay */}
        <GameOverOverlay
          overlay={shared.overlay}
          gameWidth={gameWidth}
          gameHeight={gameHeight}
          overlayTheme={theme.overlay}
        />
        {/* Pause Overlay */}
        <PauseOverlay
          overlay={shared.overlay}
          gameWidth={gameWidth}
          gameHeight={gameHeight}
          showFinishOption={showFinishOption}
          overlayTheme={theme.overlay}
        />
      </Group>
    </Canvas>
  )
})
