import type { SkFont } from '@shopify/react-native-skia'
import React from 'react'
import type { SharedValue } from 'react-native-reanimated'

import { Panel } from './Panel'
import { SkiaLabel } from './SkiaLabel'

type LabelProp = string | SharedValue<string>
type ColorProp = string | SharedValue<string>

type Props = {
  x: number
  y: number
  width: number
  height: number
  r?: number
  color: ColorProp
  label: LabelProp
  labelX: number
  labelY: number
  font: SkFont
  textColor?: string
}

/**
 * Visual button: rounded panel with label.
 * Purely presentational; tap handling is done by the gesture layer.
 */
export function SkiaButton({
  x,
  y,
  width,
  height,
  r = 10,
  color,
  label,
  labelX,
  labelY,
  font,
  textColor = 'white'
}: Props): React.JSX.Element {
  return (
    <>
      <Panel x={x} y={y} width={width} height={height} r={r} color={color} />
      <SkiaLabel x={labelX} y={labelY} text={label} font={font} color={textColor} />
    </>
  )
}
