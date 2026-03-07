import type { PathSegment } from './types'

export const remove = (
  input: PathSegment[][],
  columnsCount: number
): {
  data: PathSegment[][]
  toRemove: PathSegment[][]
  hasChanges: boolean
} => {
  const fulfilledRows = input.map(row => {
    const sum = row.reduce((acc, item) => acc + (item.end - item.start), 0)
    return sum === columnsCount
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

  for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
    if (fulfilledRows[rowIndex]) {
      const row = sortedRows[rowIndex]
      for (let i = 0; i < row.length; i++) {
        removeSet[rowIndex].add(row[i].id)
        if (row[i].super) superSegments.push({ rowIndex, item: row[i] })
      }
    }
  }

  const checkAdjacentRow = (adjRowIndex: number, seg: PathSegment) => {
    if (adjRowIndex < 0 || adjRowIndex >= sortedRows.length) return
    const adjRow = sortedRows[adjRowIndex]
    const overlapEnd = seg.end

    let left = 0
    let right = adjRow.length
    while (left < right) {
      const mid = (left + right) >> 1
      adjRow[mid].start < overlapEnd ? (left = mid + 1) : (right = mid)
    }

    for (let i = 0; i < left; i++) {
      const adjItem = adjRow[i]
      if (adjItem.end > seg.start) {
        removeSet[adjRowIndex].add(adjItem.id)
      }
    }
  }

  for (let si = 0; si < superSegments.length; si++) {
    const { rowIndex, item } = superSegments[si]
    checkAdjacentRow(rowIndex - 1, item)
    checkAdjacentRow(rowIndex + 1, item)
  }

  const toUpdate: PathSegment[][] = []
  const toRemove: PathSegment[][] = []
  for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
    const row = sortedRows[rowIndex]
    const remaining = row.filter(item => !removeSet[rowIndex].has(item.id))
    const removed = row.filter(item => removeSet[rowIndex].has(item.id))
    toUpdate.push(remaining)
    toRemove.push(removed)
  }

  return { data: toUpdate, toRemove, hasChanges: true }
}
