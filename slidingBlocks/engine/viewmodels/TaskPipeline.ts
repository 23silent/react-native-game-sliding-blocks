import { firstValueFrom, Observable, race, timer } from 'rxjs'
import { mapTo, take } from 'rxjs/operators'

import { createPipeline } from '../core/pipeline'
import type { PathSegment, PathSegmentExt } from '../model/types'
import { nop } from '../utils/nop'
export type PreparedTask = {
  rows: PathSegment[][]
  newState: Record<string, PathSegmentExt | undefined>
  step: string
  nextOverwriteIndex: number
  score: number
}

export type TaskApplyContext = {
  task: PreparedTask
  stepComplete$: Observable<void>
  getStepCompleteTimeout: (step: string) => number
  onScoreUpdate: (score: number) => void
  onApplyState: (nextOverwriteIndex: number, rows: PathSegment[][], newItems: Record<string, PathSegmentExt | undefined>) => void
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
  applyStateMiddleware,
  waitForAnimationMiddleware
])

export { runTaskApplyPipeline }
