/** Segment lifecycle state */
export enum SegmentState {
  /** Ready to reuse / slot empty */
  Idle = 'idle',
  /** On board, active */
  InUse = 'inuse',
  /** Marked for removal (e.g. fulfilled row) */
  WillRemove = 'willRemove',
  /** Animating out */
  Removing = 'removing'
}

export type PathSegment = {
  id: string
  start: number
  end: number
  color: string
  super: boolean
}

export type PathSegmentExt = PathSegment & {
  rowIndex: number
  itemIndex: number
  state: SegmentState
}

/** Returns true when slot has no segment (Idle / ready to reuse) */
export const isIdleSlot = (
  item: PathSegmentExt | undefined
): item is undefined => item === undefined

export type ItemsMap = Record<string, PathSegmentExt>

export type ProcessorStep = 'idle' | 'fit' | 'remove' | 'add' | 'gesture'

export type ProcessorState = {
  step: ProcessorStep
  data: PathSegment[][]
  hasChanges: boolean
  shouldAdd: boolean
}

export type ProcessJobResult = {
  data: PathSegment[][]
  toRemove?: PathSegment[][]
  idsToRemove?: string[]
  hasChanges: boolean
  step: ProcessorStep
}

export type TaskQueueItem = {
  step: ProcessorStep
  rows: PathSegment[][]
  rowsToRemove?: PathSegment[][]
}

export type ActiveItem =
  | { id: string; width: number; left: number; top: number; color: string }
  | undefined

/** Map of color hex string to array of block images (1x1, 1x2, 1x3, 1x4). */
export type BlockMap = Record<string, readonly (unknown | null)[]>
