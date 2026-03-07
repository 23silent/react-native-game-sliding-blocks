import type { SlidingBlocksAssets } from '../../slidingBlocks'

/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Default assets for SlidingBlocks. Host injects these; slidingBlocks has no bundled assets.
 * Omit or pass empty to use fallbacks: solid color bg, skia blocks, no sound.
 */
export const SLIDING_BLOCKS_ASSETS: SlidingBlocksAssets = {
  blockImages: {
    '#FF0000': [
      require('../../assets/blocks/r1x1.png'),
      require('../../assets/blocks/r1x2.png'),
      require('../../assets/blocks/r1x3.png'),
      require('../../assets/blocks/r1x4.png')
    ],
    '#00FF00': [
      require('../../assets/blocks/g1x1.png'),
      require('../../assets/blocks/g1x2.png'),
      require('../../assets/blocks/g1x3.png'),
      require('../../assets/blocks/g1x4.png')
    ],
    '#0000FF': [
      require('../../assets/blocks/b1x1.png'),
      require('../../assets/blocks/b1x2.png'),
      require('../../assets/blocks/b1x3.png'),
      require('../../assets/blocks/b1x4.png')
    ],
    '#FFFF00': [
      require('../../assets/blocks/y1x1.png'),
      require('../../assets/blocks/y1x2.png'),
      require('../../assets/blocks/y1x3.png'),
      require('../../assets/blocks/y1x4.png')
    ],
    '#FF00FF': [
      require('../../assets/blocks/m1x1.png'),
      require('../../assets/blocks/m1x2.png'),
      require('../../assets/blocks/m1x3.png'),
      require('../../assets/blocks/m1x4.png')
    ],
    '#00FFFF': [
      require('../../assets/blocks/lb1x1.png'),
      require('../../assets/blocks/lb1x2.png'),
      require('../../assets/blocks/lb1x3.png'),
      require('../../assets/blocks/lb1x4.png')
    ],
    '#000': [
      require('../../assets/blocks/s1x1.png'),
      require('../../assets/blocks/s1x2.png'),
      require('../../assets/blocks/s1x3.png'),
      require('../../assets/blocks/s1x4.png')
    ]
  },
  backgroundImage: require('../../assets/bg.jpg')
}
