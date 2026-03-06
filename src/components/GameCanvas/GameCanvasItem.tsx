import React from 'react'

import { activeGestureSync, BlockImage, useReactionRule } from '../../core/skia'
import type { BlockMap } from '../../model/types'
import type { ItemSlotSharedValues } from '../../engine/useSharedValuesMap'
import type { SharedValue } from 'react-native-reanimated'

type Props = {
  slot: ItemSlotSharedValues
  translateX: SharedValue<number>
  block: BlockMap
  cellSize: number
  useSkiaDrawing?: boolean
}

export function GameCanvasItem({
  slot,
  translateX,
  block,
  cellSize,
  useSkiaDrawing = false
}: Props): React.JSX.Element {
  useReactionRule(activeGestureSync(slot, translateX))

  return (
    <BlockImage
      slot={slot}
      block={block}
      cellSize={cellSize}
      useSkiaDrawing={useSkiaDrawing}
    />
  )
}
