import { useImage } from '@shopify/react-native-skia'

import type { BlockMap } from '../../engine'
import type { BlockImagesMap } from '../SlidingBlocks.types'

/** Game palette - must match SDK segment colors. */
const GAME_COLORS = [
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#000'
] as const

/**
 * Build block map from injectable image sources. Uses fixed palette for consistent hook count.
 * When blockImages is omitted or a color has no assets, those slots are null (caller uses skia blocks).
 */
export const useBlocks = (
  blockImages?: BlockImagesMap | null
): BlockMap => {
  const block: BlockMap = {} as BlockMap
  for (const color of GAME_COLORS) {
    const assets = blockImages?.[color]
    block[color] = [
      useImage((assets?.[0] ?? undefined) as number | undefined),
      useImage((assets?.[1] ?? undefined) as number | undefined),
      useImage((assets?.[2] ?? undefined) as number | undefined),
      useImage((assets?.[3] ?? undefined) as number | undefined)
    ]
  }
  return block
}
