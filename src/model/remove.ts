import { COLUMNS_COUNT } from './consts'
import type { PathSegment } from './types'

export const remove = (
  input: PathSegment[][]
): {
  data: PathSegment[][]
  toRemove: PathSegment[][]
  hasChanges: boolean
} => {
  const fulfilledRows = input.map(row => {
    const sum = row.reduce((acc, item) => acc + (item.end - item.start), 0)
    return sum === COLUMNS_COUNT
  })

  if (!fulfilledRows.some(Boolean)) {
    return {
      data: input,
      toRemove: [],
      hasChanges: false
    }
  }

  const sortedRows = input.map(row =>
    [...row].sort((a, b) => a.start - b.start)
  )

  const removeSet: Set<string>[] = sortedRows.map(() => new Set())
  const superSegments: Array<{ rowIndex: number; item: PathSegment }> = []

  sortedRows.forEach((row, rowIndex) => {
    if (fulfilledRows[rowIndex]) {
      row.forEach(item => removeSet[rowIndex].add(item.id))
      row.forEach(item => {
        if (item.super) superSegments.push({ rowIndex, item })
      })
    }
  })

  superSegments.forEach(({ rowIndex, item }) => {
    const checkAdjacentRow = (adjRowIndex: number) => {
      if (adjRowIndex < 0 || adjRowIndex >= sortedRows.length) return
      const adjRow = sortedRows[adjRowIndex]
      const overlapEnd = item.end

      let left = 0,
        right = adjRow.length
      while (left < right) {
        const mid = (left + right) >> 1
        adjRow[mid].start < overlapEnd ? (left = mid + 1) : (right = mid)
      }

      for (let i = 0; i < left; i++) {
        const adjItem = adjRow[i]
        if (adjItem.end > item.start) {
          removeSet[adjRowIndex].add(adjItem.id)
        }
      }
    }

    checkAdjacentRow(rowIndex - 1)
    checkAdjacentRow(rowIndex + 1)
  })

  const toUpdate: PathSegment[][] = []
  const toRemove: PathSegment[][] = []
  sortedRows.forEach((row, rowIndex) => {
    const remaining = row.filter(item => !removeSet[rowIndex].has(item.id))
    const removed = row.filter(item => removeSet[rowIndex].has(item.id))
    toUpdate.push(remaining)
    toRemove.push(removed)
  })

  return { data: toUpdate, toRemove, hasChanges: true }
}
