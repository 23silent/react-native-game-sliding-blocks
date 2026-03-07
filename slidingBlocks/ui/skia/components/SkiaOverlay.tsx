import { Group } from '@shopify/react-native-skia'
import React, { type ReactNode } from 'react'
import type { SharedValue } from 'react-native-reanimated'

type Props = {
  opacity: SharedValue<number>
  children: ReactNode
}

/**
 * Overlay container with opacity. Use for modal backdrops, dialogs, etc.
 */
export function SkiaOverlay({ opacity, children }: Props): React.JSX.Element {
  return <Group opacity={opacity}>{children}</Group>
}
