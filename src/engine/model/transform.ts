import type { Board, ItemsMap, PathSegment } from './types'
import { SegmentState } from './types'

export const rowsToItemsMap = (
  rows: Board,
  state: SegmentState = SegmentState.InUse
): ItemsMap => {
  const items: ItemsMap = {}
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const elements = rows[rowIndex]
    for (let itemIndex = 0; itemIndex < elements.length; itemIndex++) {
      const element = elements[itemIndex]
      items[element.id] = { ...element, rowIndex, itemIndex, state }
    }
  }
  return items
}

/**
 * Returns a new board with the specified segment translated horizontally by a column offset.
 */
export const translateSegmentOnBoard = (
  board: Board,
  rowIndex: number,
  itemIndex: number,
  offset: number
): Board => {
  const updated = [...board]
  const row = [...board[rowIndex]]
  const item = row[itemIndex]
  row[itemIndex] = {
    ...item,
    start: item.start + offset,
    end: item.end + offset
  }
  updated[rowIndex] = row
  return updated
}
