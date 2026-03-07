import {
  isIdleSlot,
  PathSegment,
  PathSegmentExt,
  SegmentState,
  TaskQueueItem
} from './types'
import { rowsToItemsMap } from './transform'

const assignItemsToSlots = (
  itemsMap: Record<string, PathSegmentExt>,
  prevState: Record<string, PathSegmentExt | undefined>,
  overwriteIndex: number,
  keysSize: number
): { newItems: Record<string, PathSegmentExt | undefined>; nextIndex: number } => {
  const newItems = { ...prevState }
  const idToKey = new Map<string, string>()
  const orderedKeys = Object.keys(newItems).sort(
    (a, b) => parseInt(a) - parseInt(b)
  )

  for (const [key, item] of Object.entries(newItems)) {
    if (item) idToKey.set(item.id, key)
  }

  let currentIndex = overwriteIndex

  for (const item of Object.values(itemsMap)) {
    const existingKey = idToKey.get(item.id)
    if (existingKey) {
      newItems[existingKey] = item
      continue
    }

    let inserted = false
    let checked = 0

    while (checked < keysSize) {
      const targetKey = orderedKeys[currentIndex]
      if (isIdleSlot(newItems[targetKey])) {
        newItems[targetKey] = item
        idToKey.set(item.id, targetKey)
        inserted = true
        break
      }
      currentIndex = (currentIndex + 1) % keysSize
      checked++
    }

    if (!inserted) {
      const fallbackKey = orderedKeys[overwriteIndex]
      newItems[fallbackKey] = item
      idToKey.set(item.id, fallbackKey)
      currentIndex = (overwriteIndex + 1) % keysSize
    }
  }

  return { newItems, nextIndex: currentIndex }
}

export const prepareTasks = (
  tasks: TaskQueueItem[],
  prevState: Record<string, PathSegmentExt | undefined>,
  prevOverwriteIndex: number,
  keysSize: number
) => {
  let nextOverwriteIndex = prevOverwriteIndex
  let ps = prevState
  const newState: Array<{
    rows: PathSegment[][]
    newState: Record<string, PathSegmentExt | undefined>
    step: string
    nextOverwriteIndex: number
    score: number
  }> = []

  for (let index = 0; index < tasks.length; index++) {
    const { rows, rowsToRemove, step } = tasks[index]
    let score = 0

    const itemsMap = rowsToItemsMap(rows)

    if (rowsToRemove?.length) {
      const toRemove = rowsToRemove?.flat() || []
      if (toRemove?.length > 0) {
        score = toRemove.reduce((acc, item) => acc + item.end - item.start, 0)
      }

      const itemsWithWillRemove = {
        ...itemsMap,
        ...rowsToItemsMap(rowsToRemove, SegmentState.WillRemove)
      }
      const itemsWithRemoving = {
        ...itemsMap,
        ...rowsToItemsMap(rowsToRemove, SegmentState.Removing)
      }

      const phase1 = assignItemsToSlots(
        itemsWithWillRemove,
        ps,
        nextOverwriteIndex,
        keysSize
      )
      newState.push({
        rows,
        newState: phase1.newItems,
        step,
        nextOverwriteIndex: phase1.nextIndex,
        score
      })

      const phase2 = assignItemsToSlots(
        itemsWithRemoving,
        phase1.newItems,
        phase1.nextIndex,
        keysSize
      )
      newState.push({
        rows,
        newState: phase2.newItems,
        step,
        nextOverwriteIndex: phase2.nextIndex,
        score: 0
      })

      ps = phase2.newItems
      nextOverwriteIndex = phase2.nextIndex
    } else {
      const result = assignItemsToSlots(
        itemsMap,
        ps,
        nextOverwriteIndex,
        keysSize
      )
      newState.push({
        rows,
        newState: result.newItems,
        step,
        nextOverwriteIndex: result.nextIndex,
        score
      })
      ps = result.newItems
      nextOverwriteIndex = result.nextIndex
    }
  }

  return newState
}
