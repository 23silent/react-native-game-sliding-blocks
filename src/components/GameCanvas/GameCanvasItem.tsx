import { Image, type SkImage } from '@shopify/react-native-skia'
import React from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { useDerivedValue } from 'react-native-reanimated'

import { activeGestureSync, useReactionRule } from '../../core/skia'
import { CELL_SIZE } from '../../model/consts'
import type { BlockMap } from '../../model/types'
import type { ItemSlotSharedValues } from '../../engine/useSharedValuesMap'

type Props = {
  slot: ItemSlotSharedValues
  translateX: SharedValue<number>
  block: BlockMap
}

export function GameCanvasItem({
  slot,
  translateX,
  block
}: Props): React.JSX.Element {
  useReactionRule(activeGestureSync(slot, translateX))

  const image = useDerivedValue<SkImage | null>(() => {
    const color = slot.color.value
    const size = Math.round(slot.width.value / CELL_SIZE)
    return (block?.[color]?.[size - 1] ?? null) as SkImage | null
  }, [block])

  return (
    <Image
      image={image}
      fit="contain"
      x={slot.translateX}
      y={slot.translateY}
      width={slot.width}
      height={CELL_SIZE}
      opacity={slot.opacity}
    />
  )
}
