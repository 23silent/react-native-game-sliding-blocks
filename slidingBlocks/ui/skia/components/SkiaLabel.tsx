import { Text } from '@shopify/react-native-skia'
import React from 'react'
import type { SharedValue } from 'react-native-reanimated'

import type { SkFont } from '@shopify/react-native-skia'

type TextProp = string | SharedValue<string>

type Props = {
  x: number
  y: number
  text: TextProp
  font: SkFont
  color?: string
}

/**
 * Renders text at position with font.
 * Accepts static or animated (SharedValue) text.
 */
export function SkiaLabel({
  x,
  y,
  text,
  font,
  color = 'white'
}: Props): React.JSX.Element {
  return <Text x={x} y={y} text={text} font={font} color={color} />
}
