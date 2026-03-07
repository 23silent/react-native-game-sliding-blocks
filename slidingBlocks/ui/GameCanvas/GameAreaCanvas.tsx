import { Canvas, Group, rect, rrect } from '@shopify/react-native-skia'
import React, { memo, useEffect, useMemo, useRef } from 'react'

import { CheckerboardGrid, Panel } from '../skia'
import { TOTAL_ASSETS_IMAGE } from '../consts'
import type { GameConfig } from '../../config'
import { LOADING_OVERLAY } from '../layoutConsts'
import { useSlidingBlocksContext } from '../SlidingBlocksContext'
import { useComposableSlidingBlocksContext } from '../ComposableSlidingBlocksContext'
import { GameCanvasExplosion } from './GameCanvasExplosion'
import { GameCanvasGhost } from './GameCanvasGhost'
import { GameCanvasIndicator } from './GameCanvasIndicator'
import { GameCanvasItem } from './GameCanvasItem'
import { GameOverOverlay } from './GameOverOverlay'
import { PauseOverlay } from './PauseOverlay'
import type { BlockRenderMode } from './GameCanvas'
import { scheduleIdle, cancelIdle } from '../utils/scheduleIdle'

/** Count block images for image mode; skia mode has no assets to load. */
function countLoadedBlockAssets(
  block: import('../../engine').BlockMap,
  blockRenderMode: BlockRenderMode
): number {
  if (blockRenderMode !== 'image') return 0
  let loaded = 0
  for (const color of Object.keys(block)) {
    for (let i = 0; i < 4; i++) {
      if (block[color]?.[i] != null) loaded++
    }
  }
  return loaded
}

type GameAreaCanvasProps = {
  blockRenderMode?: BlockRenderMode
  showFinishOption?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

/**
 * Standalone game area - Skia Canvas (blocks, grid, overlays).
 * Use with useSlidingBlocks composable API. Renders inside Root; reads layout/shared from context.
 */
export const GameAreaCanvas = memo(function GameAreaCanvas({
  blockRenderMode = 'image',
  showFinishOption = false,
  onLoadProgress,
  onLoadComplete
}: GameAreaCanvasProps): React.JSX.Element {
  const { theme, settings } = useSlidingBlocksContext()
  const { shared, config, block, hasBlockImages } =
    useComposableSlidingBlocksContext()

  const {
    cellSize,
    gameWidth,
    gameHeight,
    rowsCount,
    columnsCount,
    keys
  } = config

  const completedRef = useRef(false)
  const useSkiaDrawing = blockRenderMode === 'skia' || !hasBlockImages
  const totalAssets =
    hasBlockImages && blockRenderMode === 'image'
      ? TOTAL_ASSETS_IMAGE - 1
      : 1
  const loadedAssets =
    hasBlockImages && blockRenderMode === 'image'
      ? countLoadedBlockAssets(block, blockRenderMode)
      : 1

  const progress = useMemo(
    () => loadedAssets / totalAssets,
    [loadedAssets, totalAssets]
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

  return (
    <Canvas style={{ width: gameWidth, height: gameHeight }}>
      <Group clip={rrect(rect(0, 0, gameWidth, gameHeight), 16, 16)}>
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
        <GameCanvasIndicator
          indicator={shared.indicator}
          translateX={shared.translateX}
          cellSize={cellSize}
          rowsCount={rowsCount}
        />
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
        <GameOverOverlay
          overlay={shared.overlay}
          gameWidth={gameWidth}
          gameHeight={gameHeight}
          overlayTheme={theme.overlay}
        />
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
