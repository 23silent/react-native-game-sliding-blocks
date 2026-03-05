import { useImage } from '@shopify/react-native-skia'

import type { BlockMap } from '../model/types'

/* eslint-disable @typescript-eslint/no-var-requires */
export const useBlocks = (): BlockMap => {
  const r1x1 = useImage(require('../assets/blocks/r1x1.png'))
  const r1x2 = useImage(require('../assets/blocks/r1x2.png'))
  const r1x3 = useImage(require('../assets/blocks/r1x3.png'))
  const r1x4 = useImage(require('../assets/blocks/r1x4.png'))
  const g1x1 = useImage(require('../assets/blocks/g1x1.png'))
  const g1x2 = useImage(require('../assets/blocks/g1x2.png'))
  const g1x3 = useImage(require('../assets/blocks/g1x3.png'))
  const g1x4 = useImage(require('../assets/blocks/g1x4.png'))
  const b1x1 = useImage(require('../assets/blocks/b1x1.png'))
  const b1x2 = useImage(require('../assets/blocks/b1x2.png'))
  const b1x3 = useImage(require('../assets/blocks/b1x3.png'))
  const b1x4 = useImage(require('../assets/blocks/b1x4.png'))
  const y1x1 = useImage(require('../assets/blocks/y1x1.png'))
  const y1x2 = useImage(require('../assets/blocks/y1x2.png'))
  const y1x3 = useImage(require('../assets/blocks/y1x3.png'))
  const y1x4 = useImage(require('../assets/blocks/y1x4.png'))
  const m1x1 = useImage(require('../assets/blocks/m1x1.png'))
  const m1x2 = useImage(require('../assets/blocks/m1x2.png'))
  const m1x3 = useImage(require('../assets/blocks/m1x3.png'))
  const m1x4 = useImage(require('../assets/blocks/m1x4.png'))
  const lb1x1 = useImage(require('../assets/blocks/lb1x1.png'))
  const lb1x2 = useImage(require('../assets/blocks/lb1x2.png'))
  const lb1x3 = useImage(require('../assets/blocks/lb1x3.png'))
  const lb1x4 = useImage(require('../assets/blocks/lb1x4.png'))
  const s1x1 = useImage(require('../assets/blocks/s1x1.png'))
  const s1x2 = useImage(require('../assets/blocks/s1x2.png'))
  const s1x3 = useImage(require('../assets/blocks/s1x3.png'))
  const s1x4 = useImage(require('../assets/blocks/s1x4.png'))

  const block = {
    '#FF0000': [r1x1, r1x2, r1x3, r1x4],
    '#00FF00': [g1x1, g1x2, g1x3, g1x4],
    '#0000FF': [b1x1, b1x2, b1x3, b1x4],
    '#FFFF00': [y1x1, y1x2, y1x3, y1x4],
    '#FF00FF': [m1x1, m1x2, m1x3, m1x4],
    '#00FFFF': [lb1x1, lb1x2, lb1x3, lb1x4],
    '#000': [s1x1, s1x2, s1x3, s1x4]
  }
  return block
}
