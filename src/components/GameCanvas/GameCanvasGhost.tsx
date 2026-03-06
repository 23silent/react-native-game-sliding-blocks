import React from 'react'

import { BlockImage } from '../../core/skia'
import type { BlockMap } from '../../model/types'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'

type Props = {
  ghost: SharedValuesMap['ghost']
  block: BlockMap
  cellSize: number
  useSkiaDrawing?: boolean
}

export function GameCanvasGhost({
  ghost,
  block,
  cellSize,
  useSkiaDrawing = false
}: Props): React.JSX.Element {
  return (
    <BlockImage
      slot={ghost}
      block={block}
      cellSize={cellSize}
      useSkiaDrawing={useSkiaDrawing}
    />
  )
}
