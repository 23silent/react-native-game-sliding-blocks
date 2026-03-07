import React from 'react'
import { useDerivedValue } from 'react-native-reanimated'

import { PositionedRect } from '../skia'
import type { SharedValuesMap } from '../../bridge'

type Props = {
  indicator: SharedValuesMap['indicator']
  translateX: SharedValuesMap['translateX']
  cellSize: number
  rowsCount: number
}

export function GameCanvasIndicator({
  indicator,
  translateX,
  cellSize,
  rowsCount
}: Props): React.JSX.Element {
  const x = useDerivedValue(
    () => indicator.left.value + translateX.value
  )

  return (
    <PositionedRect
      x={x}
      y={0}
      width={indicator.width}
      height={cellSize * rowsCount}
      color="blue"
      opacity={indicator.opacity}
    />
  )
}
