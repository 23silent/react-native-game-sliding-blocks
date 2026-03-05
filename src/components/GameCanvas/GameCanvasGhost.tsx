import { Image, type SkImage } from '@shopify/react-native-skia'
import React from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { CELL_SIZE } from '../../model/consts'
import type { BlockMap } from '../../model/types'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'

type Props = {
  ghost: SharedValuesMap['ghost']
  block: BlockMap
}

export function GameCanvasGhost({ ghost, block }: Props): React.JSX.Element {
  const image = useDerivedValue<SkImage | null>(
    () => {
      const color = ghost.color.value
      const size = Math.round(ghost.width.value / CELL_SIZE)
      return (block?.[color]?.[size - 1] ?? null) as SkImage | null
    },
    [block]
  )

  return (
    <Image
      image={image}
      fit="contain"
      x={ghost.translateX}
      y={ghost.translateY}
      width={ghost.width}
      height={CELL_SIZE}
      opacity={ghost.opacity}
    />
  )
}
