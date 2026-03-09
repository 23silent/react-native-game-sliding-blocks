import { firstValueFrom, Observable, race, timer } from 'rxjs'
import { mapTo, take } from 'rxjs/operators'

import { createPipeline } from '../core/pipeline'
import type {
  PathSegment,
  PathSegmentExt,
  ProcessorStep
} from '../model/types'
import { nop } from '../utils/nop'
export type PreparedTask = {
  rows: PathSegment[][]
  newState: Record<string, PathSegmentExt | undefined>
  step: ProcessorStep
  nextOverwriteIndex: number
  score: number
}

export type TaskApplyContext = {
  task: PreparedTask
  stepComplete$: Observable<void>
  getStepCompleteTimeout: (step: ProcessorStep) => number
  onScoreUpdate: (score: number) => void
  onApplyState: (nextOverwriteIndex: number, rows: PathSegment[][], newItems: Record<string, PathSegmentExt | undefined>) => void
  onRowAdded?: (row: PathSegment[]) => void
}

function updateScoreMiddleware(
  ctx: TaskApplyContext,
  next: () => Promise<void>
): Promise<void> {
  const { task } = ctx
  if (task.step === 'remove' && task.score > 0) {
    ctx.onScoreUpdate(task.score)
  }
  return next()
}

function onRowAddedMiddleware(
  ctx: TaskApplyContext,
  next: () => Promise<void>
): Promise<void> {
  if (ctx.task.step === 'add' && ctx.task.rows.length > 0) {
    try {
      ctx.onRowAdded?.(ctx.task.rows[0])
    } catch {
      nop()
    }
  }
  return next()
}

function applyStateMiddleware(
  ctx: TaskApplyContext,
  next: () => Promise<void>
): Promise<void> {
  const { task } = ctx
  ctx.onApplyState(task.nextOverwriteIndex, task.rows, task.newState)
  return next()
}

async function waitForAnimationMiddleware(
  ctx: TaskApplyContext,
  next: () => Promise<void>
): Promise<void> {
  const { task, stepComplete$, getStepCompleteTimeout } = ctx
  const safetyMs = getStepCompleteTimeout(task.step) * 3
  await firstValueFrom(
    race(
      stepComplete$.pipe(take(1)),
      timer(safetyMs).pipe(mapTo(undefined))
    )
  )
  return next()
}

const runTaskApplyPipeline = createPipeline<TaskApplyContext>([
  updateScoreMiddleware,
  onRowAddedMiddleware,
  applyStateMiddleware,
  waitForAnimationMiddleware
])

export { runTaskApplyPipeline }
