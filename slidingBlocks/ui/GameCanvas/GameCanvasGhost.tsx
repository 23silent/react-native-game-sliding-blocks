import React from 'react'

import { BlockImage } from '../skia'
import type { BlockMap } from '../../engine'
import type { BlockSettings } from '../../types'
import type { BlockTheme } from '../SlidingBlocks.types'
import type { SharedValuesMap } from '../../bridge'

type Props = {
  ghost: SharedValuesMap['ghost']
  block: BlockMap
  cellSize: number
  useSkiaDrawing?: boolean
  blockSettings: BlockSettings
  blockTheme: BlockTheme
}

export function GameCanvasGhost({
  ghost,
  block,
  cellSize,
  useSkiaDrawing = false,
  blockSettings,
  blockTheme
}: Props): React.JSX.Element {
  return (
    <BlockImage
      slot={ghost}
      block={block}
      cellSize={cellSize}
      useSkiaDrawing={useSkiaDrawing}
      blockSettings={blockSettings}
      blockTheme={blockTheme}
    />
  )
}
