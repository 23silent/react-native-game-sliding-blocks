import { COLUMNS_COUNT } from './consts'
import type { PathSegment } from './types'

type Gap = { start: number; end: number }

const calculateGaps = (items: PathSegment[]): Gap[] => {
  const gaps: Gap[] = []
  let lastEnd = 0

  const sortedItems = [...items].sort((a, b) => a.start - b.start)

  for (const item of sortedItems) {
    if (item.start > lastEnd) {
      gaps.push({ start: lastEnd, end: item.start })
    }
    lastEnd = Math.max(lastEnd, item.end)
  }

  if (lastEnd < COLUMNS_COUNT) {
    gaps.push({ start: lastEnd, end: COLUMNS_COUNT })
  }

  return gaps
}

const findContainingGap = (gaps: Gap[], item: PathSegment): number => {
  let left = 0
  let right = gaps.length - 1

  while (left <= right) {
    const mid = (left + right) >> 1
    const gap = gaps[mid]

    if (item.end <= gap.start) {
      right = mid - 1
    } else if (item.start >= gap.end) {
      left = mid + 1
    } else {
      return item.start >= gap.start && item.end <= gap.end ? mid : -1
    }
  }

  return -1
}

export const fit = (
  data: PathSegment[][]
): { data: PathSegment[][]; hasChanges: boolean } => {
  let hasChanges = false
  const workingData = data.map(row => [...row])

  do {
    hasChanges = false

    for (let rowIndex = 0; rowIndex < workingData.length - 1; rowIndex++) {
      const currentRow = workingData[rowIndex]
      const nextRow = workingData[rowIndex + 1]
      const nextRowGaps = calculateGaps(nextRow)

      const sortedCurrentRow = [...currentRow].sort((a, b) => a.start - b.start)
      const movedItems: PathSegment[] = []
      const remainingItems: PathSegment[] = []

      for (const item of sortedCurrentRow) {
        const gapIndex = findContainingGap(nextRowGaps, item)
        if (gapIndex !== -1) {
          movedItems.push(item)
          hasChanges = true
        } else {
          remainingItems.push(item)
        }
      }

      workingData[rowIndex] = remainingItems
      workingData[rowIndex + 1] = [...nextRow, ...movedItems].sort(
        (a, b) => a.start - b.start
      )
    }
  } while (hasChanges)

  return {
    data: workingData,
    hasChanges: !arraysEqual(data, workingData)
  }
}

const arraysEqual = (a: PathSegment[][], b: PathSegment[][]): boolean => {
  if (a.length !== b.length) return false
  return a.every(
    (row, i) =>
      row.length === b[i].length &&
      row.every(
        (seg, j) => seg.start === b[i][j].start && seg.end === b[i][j].end
      )
  )
}
