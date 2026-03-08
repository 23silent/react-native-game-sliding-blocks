import { Canvas, Group, rect, rrect } from '@shopify/react-native-skia'
import React, { memo } from 'react'

import { TOTAL_BLOCK_ASSETS } from '../../constants/game'
import type { BlockMap } from '../../engine'
import { useComposableSlidingBlocksContext } from '../ComposableSlidingBlocksContext'
import { CheckerboardGrid, Panel } from '../skia'
import { useSlidingBlocksContext } from '../SlidingBlocksContext'
import type { BlockRenderMode } from './GameCanvas'
import { GameCanvasExplosion } from './GameCanvasExplosion'
import { GameCanvasGhost } from './GameCanvasGhost'
import { GameCanvasIndicator } from './GameCanvasIndicator'
import { GameCanvasItem } from './GameCanvasItem'
import { GameOverOverlay } from './GameOverOverlay'
import { PauseOverlay } from './PauseOverlay'
import { useAssetLoadProgress } from './useAssetLoadProgress'

/** Count block images for image mode; skia mode has no assets to load. */
function countLoadedBlockAssets(
  block: BlockMap,
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

/**
 * Props for GameAreaCanvas (composable API).
 * Use with useSlidingBlocks; render GameArea inside Root.
 */
type GameAreaCanvasProps = {
  /** 'image' loads block assets; 'skia' draws blocks without images. */
  blockRenderMode?: BlockRenderMode
  /** When true, pause overlay shows a "Finish" button. */
  showFinishOption?: boolean
  /** Called as block images load (0–1). Use to drive a loading overlay. */
  onLoadProgress?: (progress: number) => void
  /** Called when assets are ready and MIN_DISPLAY_MS has elapsed. */
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

  const useSkiaDrawing = blockRenderMode === 'skia' || !hasBlockImages
  const totalAssets =
    hasBlockImages && blockRenderMode === 'image' ? TOTAL_BLOCK_ASSETS : 1
  const loadedAssets =
    hasBlockImages && blockRenderMode === 'image'
      ? countLoadedBlockAssets(block, blockRenderMode)
      : 1

  useAssetLoadProgress(totalAssets, loadedAssets, onLoadProgress, onLoadComplete)

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
        {settings.explosionPresets?.explosionEnabled !== false &&
          shared.explosionPool.map((slot, i) => (
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
