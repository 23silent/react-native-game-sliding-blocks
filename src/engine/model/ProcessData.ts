import { fit } from './fit'
import { generateSegmentsWithGaps } from './generate'
import { remove } from './remove'
import type {
  Board,
  ProcessJobResult,
  ProcessorState,
  ProcessorStep
} from './types'

export type ProcessDataConfig = {
  rowsCount: number
  columnsCount: number
}

/**
 * Processor state machine.
 *
 * Transitions:
 * - 'gesture' -> 'fit'
 * - 'fit' -> 'remove'
 * - 'remove' -> 'fit' (when rows were removed, may also mark shouldAdd)
 * - 'remove' -> 'add' | 'idle' (depending on shouldAdd / board emptiness)
 * - 'add' -> 'fit'
 * - 'idle' -> 'idle' (no-op)
 */
type ProcessorTransitionResult = ProcessJobResult & {
  nextState: ProcessorState
}

const advanceFromRemoveStep = (
  state: ProcessorState,
  columnsCount: number
): ProcessorTransitionResult => {
  const removeResult = remove(state.data, columnsCount)
  const baseNext: ProcessorState = {
    ...state,
    data: removeResult.data,
    hasChanges: removeResult.hasChanges
  }

  if (removeResult.toRemove.length > 0) {
    const nextState: ProcessorState = {
      ...baseNext,
      step: 'fit',
      shouldAdd: true
    }
    return {
      ...removeResult,
      idsToRemove: removeResult.toRemove.flat().map(item => item.id),
      step: 'remove',
      nextState
    }
  }

  const nextStep: ProcessorStep =
    state.shouldAdd || removeResult.data.length === 0 ? 'add' : 'idle'
  const nextState: ProcessorState = {
    ...baseNext,
    step: nextStep
  }

  return {
    data: removeResult.data,
    hasChanges: false,
    step: 'remove',
    nextState
  }
}

/**
 * Advance the processor state machine by one step.
 *
 * This function is deliberately pure: given the current state and board width,
 * it returns the public result for the current step plus the next internal state.
 */
const reduceProcessor = (
  state: ProcessorState,
  columnsCount: number
): ProcessorTransitionResult => {
  switch (state.step) {
    case 'gesture': {
      const nextState: ProcessorState = {
        ...state,
        step: 'fit'
      }
      return {
        data: state.data,
        hasChanges: state.hasChanges,
        step: 'gesture',
        nextState
      }
    }
    case 'fit': {
      const fitResult = fit(state.data, columnsCount)
      const nextState: ProcessorState = {
        ...state,
        data: fitResult.data,
        step: 'remove',
        hasChanges: fitResult.hasChanges
      }
      return {
        data: fitResult.data,
        hasChanges: fitResult.hasChanges,
        step: 'fit',
        nextState
      }
    }
    case 'remove':
      return advanceFromRemoveStep(state, columnsCount)
    case 'add': {
      const newData = [
        ...state.data.slice(1),
        generateSegmentsWithGaps(columnsCount)
      ]
      const nextState: ProcessorState = {
        ...state,
        data: newData,
        hasChanges: true,
        step: 'fit',
        shouldAdd: false
      }
      return {
        data: newData,
        hasChanges: true,
        step: 'add',
        nextState
      }
    }
    default: {
      const nextState: ProcessorState = state
      return {
        data: state.data,
        hasChanges: false,
        step: state.step,
        nextState
      }
    }
  }
}

export class ProcessData {
  private state: ProcessorState = {
    step: 'idle',
    data: [],
    hasChanges: false,
    shouldAdd: false
  }

  constructor(private readonly config: ProcessDataConfig) {}

  public processJob = (): ProcessJobResult => {
    const { columnsCount } = this.config
    const result = reduceProcessor(this.state, columnsCount)
    this.state = result.nextState
    const { nextState, ...publicResult } = result
    return publicResult
  }

  public setSegments = (data: Board, step: ProcessorStep = 'fit') => {
    const current = this.state
    this.state = {
      ...current,
      data,
      step,
      shouldAdd: data !== current.data
    }
  }

  public initializeWithGenerated = () => {
    const { rowsCount, columnsCount } = this.config
    const initialData = Array.from({ length: rowsCount }, (_, i) =>
      i < rowsCount - 2 ? [] : generateSegmentsWithGaps(columnsCount)
    )
    this.setSegments(initialData)
  }

  /** Restore from persisted state (rows only). Step is set to 'idle'. */
  public initializeWithState = (rows: Board): void => {
    this.setSegments(rows, 'idle')
  }
}

