import {
  Canvas,
  Fill,
  Group,
  Image,
  rect,
  rrect,
  useImage
} from '@shopify/react-native-skia'
import React, { memo, useMemo } from 'react'

import type { SharedValuesMap } from '../../bridge'
import type { GameConfig } from '../../config'
import { TOTAL_BLOCK_ASSETS } from '../../constants/game'
import type { BlockMap } from '../../engine'
import type { GameLayout } from '../../types/layout'
import { CheckerboardGrid, Panel } from '../skia'
import type { ImageSource } from '../SlidingBlocks.types'
import { useSlidingBlocksContext } from '../SlidingBlocksContext'
import { GameCanvasExplosion } from './GameCanvasExplosion'
import { GameCanvasGhost } from './GameCanvasGhost'
import { GameCanvasIndicator } from './GameCanvasIndicator'
import { GameCanvasItem } from './GameCanvasItem'
import { GameCanvasScoreBar } from './GameCanvasScoreBar'
import { GameOverOverlay } from './GameOverOverlay'
import { PauseOverlay } from './PauseOverlay'
import { useAssetLoadProgress } from './useAssetLoadProgress'

export type { GameLayout } from '../../types/layout'
export type BlockRenderMode = 'image' | 'skia'

const styles = { canvas: { flex: 1 } }

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
  const useSkiaDrawing =
    blockRenderMode === 'skia' || !hasBlockImages
  const totalAssets = useMemo(() => {
    const blockCount =
      hasBlockImages && blockRenderMode === 'image' ? TOTAL_BLOCK_ASSETS : 0
    const bgCount = backgroundImage != null ? 1 : 0
    return Math.max(1, blockCount + bgCount)
  }, [hasBlockImages, blockRenderMode, backgroundImage])

  const loadedAssets = useMemo(
    () =>
      countLoadedAssets(
        block,
        bgImage,
        hasBlockImages,
        blockRenderMode,
        totalAssets
      ),
    [block, bgImage, hasBlockImages, blockRenderMode, totalAssets]
  )

  useAssetLoadProgress(totalAssets, loadedAssets, onLoadProgress, onLoadComplete)

  return (
    <Canvas style={styles.canvas}>
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
        <GameCanvasScoreBar
          layout={layout}
          shared={shared}
          theme={theme}
          embedded
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
