import { Rect } from '@shopify/react-native-skia'
import React from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { CELL_SIZE, ROWS_COUNT } from '../../model/consts'
import type { SharedValuesMap } from '../../engine/useSharedValuesMap'

type Props = {
  indicator: SharedValuesMap['indicator']
  translateX: SharedValuesMap['translateX']
}

export function GameCanvasIndicator({
  indicator,
  translateX
}: Props): React.JSX.Element {
  const x = useDerivedValue(
    () => indicator.left.value + translateX.value
  )

  return (
    <Rect
      x={x}
      y={0}
      width={indicator.width}
      height={CELL_SIZE * ROWS_COUNT}
      color="blue"
      opacity={indicator.opacity}
    />
  )
}
