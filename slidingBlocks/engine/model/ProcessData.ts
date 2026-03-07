import type {
  PathSegment,
  ProcessJobResult,
  ProcessorState,
  ProcessorStep
} from './types'
import { fit } from './fit'
import { generateSegmentsWithGaps } from './generate'
import { remove } from './remove'

export type ProcessDataConfig = {
  rowsCount: number
  columnsCount: number
}

export class ProcessData {
  private state: ProcessorState = {
    step: 'idle',
    data: [],
    hasChanges: false,
    shouldAdd: false
  }

  constructor(private readonly config: ProcessDataConfig) {}

  private updateState = (partial: Partial<ProcessorState>) => {
    const current = this.state
    this.state = { ...current, ...partial }
  }

  public processJob = (): ProcessJobResult => {
    const state = this.state
    const { columnsCount, rowsCount } = this.config

    switch (state.step) {
      case 'gesture': {
        this.updateState({ ...state, step: 'fit' })
        return {
          data: state.data,
          hasChanges: state.hasChanges,
          step: 'gesture'
        }
      }
      case 'fit': {
        const fitResult = fit(state.data, columnsCount)
        this.updateState({
          data: fitResult.data,
          step: 'remove',
          hasChanges: fitResult.hasChanges
        })
        return {
          data: fitResult.data,
          hasChanges: fitResult.hasChanges,
          step: 'fit'
        }
      }
      case 'remove': {
        const removeResult = remove(state.data, columnsCount)
        this.updateState({
          data: removeResult.data,
          hasChanges: removeResult.hasChanges
        })

        if (removeResult.toRemove.length > 0) {
          this.updateState({ step: 'fit', shouldAdd: true })
          return {
            ...removeResult,
            idsToRemove: removeResult.toRemove.flat().map(item => item.id),
            step: 'remove'
          }
        }

        const nextStep =
          state.shouldAdd || removeResult.data.length === 0 ? 'add' : 'idle'
        this.updateState({ step: nextStep })

        return {
          data: removeResult.data,
          hasChanges: false,
          step: 'remove'
        }
      }
      case 'add': {
        const newData = [
          ...state.data.slice(1),
          generateSegmentsWithGaps(columnsCount)
        ]
        this.updateState({
          data: newData,
          hasChanges: true,
          step: 'fit',
          shouldAdd: false
        })
        return { data: newData, hasChanges: true, step: 'add' }
      }
      default:
        return {
          data: state.data,
          hasChanges: false,
          step: state.step
        }
    }
  }

  public setSegments = (data: PathSegment[][], step: ProcessorStep = 'fit') => {
    const current = this.state
    this.updateState({
      data,
      step,
      shouldAdd: data !== current.data
    })
  }

  public initializeWithGenerated = () => {
    const { rowsCount, columnsCount } = this.config
    const initialData = Array.from({ length: rowsCount }, (_, i) =>
      i < rowsCount - 2 ? [] : generateSegmentsWithGaps(columnsCount)
    )
    this.setSegments(initialData)
  }
}
