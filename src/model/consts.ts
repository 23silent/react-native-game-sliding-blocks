import { Dimensions } from 'react-native'

export const ROWS_COUNT = 10
export const COLUMNS_COUNT = 8
export const PADDING = 30

export const KEYS_SIZE = 48
export const KEYS = Array.from({ length: KEYS_SIZE }, (_, i) => String(i))

export const CELL_SIZE = (() => {
  const { width } = Dimensions.get('window')
  const size = width - PADDING * 2
  const cellSize = size / COLUMNS_COUNT
  return cellSize
})()
