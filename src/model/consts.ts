import { Dimensions } from 'react-native'

export const ROWS_COUNT = 10
export const COLUMNS_COUNT = 8
export const PADDING = 30

export const KEYS_SIZE = 48
export const KEYS = Array.from({ length: KEYS_SIZE }, (_, i) => String(i))

/** Pool size for concurrent explosion animations (limits Skia work per frame) */
export const EXPLOSION_POOL_SIZE = 6

/**
 * Computed once at module load. Does not update on rotation or dimension change.
 * For responsive layouts, consider computing CELL_SIZE in a hook.
 */
export const CELL_SIZE = (() => {
  const { width } = Dimensions.get('window')
  const size = width - PADDING * 2
  const cellSize = size / COLUMNS_COUNT
  return cellSize
})()
