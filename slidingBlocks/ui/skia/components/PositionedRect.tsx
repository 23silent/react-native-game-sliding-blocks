import { Rect } from '@shopify/react-native-skia'
import React from 'react'
import type { SharedValue } from 'react-native-reanimated'

type Props = {
  x: SharedValue<number> | number
  y: number
  width: SharedValue<number> | number
  height: number
  color?: string
  opacity?: SharedValue<number> | number
}

/**
 * Rect with optional SharedValue-driven position and dimensions.
 * Used for indicators and other animated rects.
 */
export function PositionedRect({
  x,
  y,
  width,
  height,
  color = 'blue',
  opacity = 1
}: Props): React.JSX.Element {
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      color={color}
      opacity={opacity}
    />
  )
}
