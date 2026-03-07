import { RoundedRect } from '@shopify/react-native-skia'
import React from 'react'
import type { SharedValue } from 'react-native-reanimated'

type ColorProp = string | SharedValue<string>

type Props = {
  x: number
  y: number
  width: number
  height: number
  r?: number
  color: ColorProp
}

/**
 * Rounded rectangle panel. Accepts static or animated color.
 * Used for overlays, action bars, dialogs, and buttons.
 */
export function Panel({
  x,
  y,
  width,
  height,
  r = 0,
  color
}: Props): React.JSX.Element {
  return (
    <RoundedRect
      x={x}
      y={y}
      width={width}
      height={height}
      r={r}
      color={color}
    />
  )
}
