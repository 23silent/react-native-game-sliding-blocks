import { BehaviorSubject, Observable, Subject } from 'rxjs'
import { take } from 'rxjs/operators'

import type { EngineConfig } from '../config'
import type { GameEngineHost } from '../host'
import { ANIM, type AnimConfig } from '../model/animConsts'
import { prepareTasks } from '../model/prepareTasks'
import { ProcessData } from '../model/ProcessData'
import type {
  ActiveItem,
  PathSegment,
  PathSegmentExt,
  TaskQueueItem
} from '../model/types'
import type { GameStateSnapshot } from '../state'
import { getLayoutVersion } from '../state'
import { runTaskApplyPipeline } from './TaskPipeline'

type ComboState = {
  streak: number
  multiplier: number
  score: number
}

const applyScore = (
  state: ComboState,
  removedCellsScore: number
): ComboState => {
  if (removedCellsScore <= 0) {
    return {
      streak: 0,
      multiplier: 1,
      score: state.score
    }
  }

  const streak = state.streak + 1
  const multiplier = Math.min(streak, 5)
  const score = state.score + removedCellsScore * multiplier

  return {
    streak,
    multiplier,
    score
  }
}

/**
 * GameViewModel - Main game presentation logic.
 * Orchestrates ProcessData (model), exposes RxJS streams.
 * No platform dependencies - uses optional host for sound.
 */
export class GameViewModel {
  private taskQueue: TaskQueueItem[] = []
  private tempRemoveQueue: Set<string> = new Set()
  private nextOverwriteIndex = 0
  private processing = false
  private rows: PathSegment[][] = []
  private applyVersion = 0
  private comboStreak = 0

  private readonly keys: string[]

  readonly items$: BehaviorSubject<Partial<Record<string, PathSegmentExt>>>
  readonly activeItem$: Observable<ActiveItem | undefined>
  readonly score$: Observable<number>
  readonly multiplier$: Observable<number>
  readonly gameOver$: Observable<{ score: number } | null>
  readonly onChangeItems$: Observable<Partial<Record<string, PathSegmentExt>>>

  private readonly activeItemSubject$ = new Subject<ActiveItem | undefined>()
  private readonly scoreSubject$ = new BehaviorSubject<number>(0)
  private readonly multiplierSubject$ = new BehaviorSubject<number>(1)
  private readonly gameOverSubject$ = new BehaviorSubject<{ score: number } | null>(
    null
  )

  private processData: ProcessData

  private readonly anim: AnimConfig
  private readonly onRowAdded?: (row: PathSegment[]) => void

  private readonly onGameStateChange?: (state: GameStateSnapshot) => void

  constructor(
    private readonly config: EngineConfig,
    private readonly stepComplete$: Observable<void>,
    private readonly overlayFadeOutComplete$: Observable<void>,
    host?: GameEngineHost,
    onRowAdded?: (row: PathSegment[]) => void,
    animOverrides?: Partial<AnimConfig>,
    options?: {
      initialState?: GameStateSnapshot
      onGameStateChange?: (state: GameStateSnapshot) => void
    }
  ) {
    this.anim = {
      removeFadeMs: animOverrides?.removeFadeMs ?? ANIM.REMOVE_FADE,
      itemDropMs: animOverrides?.itemDropMs ?? ANIM.ITEM_DROP
    }
    this.onRowAdded = onRowAdded
    this.onGameStateChange = options?.onGameStateChange
    this.keys = config.keys
    const emptyItems = this.keys.reduce<Partial<Record<string, PathSegmentExt>>>(
      (acc, item) => ({ ...acc, [item]: undefined }),
      {}
    )
    this.items$ = new BehaviorSubject(emptyItems)

    this.processData = new ProcessData({
      rowsCount: config.rowsCount,
      columnsCount: config.columnsCount
    })
    this.activeItem$ = this.activeItemSubject$.asObservable()
    this.score$ = this.scoreSubject$.asObservable()
    this.multiplier$ = this.multiplierSubject$.asObservable()
    this.gameOver$ = this.gameOverSubject$.asObservable()
    this.onChangeItems$ = this.items$.asObservable()

    const initialState = options?.initialState
    if (initialState) {
      this.processData.initializeWithState(initialState.rows)
      this.rows = initialState.rows
      this.scoreSubject$.next(initialState.score)
      this.multiplierSubject$.next(initialState.multiplier)
      if (initialState.gameOver) {
        this.gameOverSubject$.next({ score: initialState.score })
      }
      const prepared = prepareTasks(
        [{ step: 'idle', rows: initialState.rows }],
        emptyItems,
        0,
        config.keysSize
      )
      if (prepared.length > 0) {
        const { newState: newItems, nextOverwriteIndex } = prepared[0]
        this.nextOverwriteIndex = nextOverwriteIndex
        this.items$.next(newItems)
      }
      this.setProcessing(false)
      this.emitGameStateChange()
    } else {
      this.processData.initializeWithGenerated()
      this.setProcessing(true)
      this.doProcess()
    }
  }

  getGameOver = (): { score: number } | null =>
    this.gameOverSubject$.getValue()

  getRows = (): PathSegment[][] => this.rows
  isProcessing = (): boolean => this.processing

  getState = (): GameStateSnapshot => {
    const gameOver = this.gameOverSubject$.getValue()
    return {
      rows: this.rows,
      score: this.scoreSubject$.getValue(),
      multiplier: this.multiplierSubject$.getValue(),
      layoutVersion: getLayoutVersion(this.config),
      gameOver: gameOver !== null
    }
  }

  private resetCombo = (): void => {
    this.comboStreak = 0
    this.multiplierSubject$.next(1)
  }

  private applyRemovedCellsScore = (removedCellsScore: number): void => {
    const currentState: ComboState = {
      streak: this.comboStreak,
      multiplier: this.multiplierSubject$.getValue(),
      score: this.scoreSubject$.getValue()
    }
    const nextState = applyScore(currentState, removedCellsScore)
    this.comboStreak = nextState.streak
    this.scoreSubject$.next(nextState.score)
    this.multiplierSubject$.next(nextState.multiplier)
  }

  private emitGameStateChange = (): void => {
    this.onGameStateChange?.(this.getState())
  }

  private getStepCompleteTimeout(step: 'idle' | 'fit' | 'remove' | 'add' | 'gesture'): number {
    return step === 'remove'
      ? this.anim.removeFadeMs + 50
      : this.anim.itemDropMs + 50
  }

  setProcessing = (isProcessing: boolean): void => {
    this.processing = isProcessing
  }

  setActiveItem = (item?: ActiveItem): void =>
    this.activeItemSubject$.next(item)

  removeItem = (key: string): void => {
    this.tempRemoveQueue.add(key)
  }

  onCompleteGesture = (rows: PathSegment[][]): void => {
    this.applyGestureResultSync(rows)
    this.setProcessing(true)
    this.processData.setSegments(rows, 'gesture')
    this.doProcess()
  }

  private applyGestureResultSync = (rows: PathSegment[][]): void => {
    const task = { step: 'gesture' as const, rows }
    const prepared = prepareTasks(
      [task],
      this.items$.getValue(),
      this.nextOverwriteIndex,
      this.config.keysSize
    )
    if (prepared.length > 0) {
      const { rows: r, newState, nextOverwriteIndex } = prepared[0]
      this.rows = r
      this.nextOverwriteIndex = nextOverwriteIndex
      this.items$.next(newState)
      this.emitGameStateChange()
    }
  }

  restart = (): void => {
    const wasGameOver = this.gameOverSubject$.getValue() !== null
    this.gameOverSubject$.next(null)
    this.applyVersion++
    this.taskQueue = []
    this.tempRemoveQueue.clear()
    this.nextOverwriteIndex = 0
    this.rows = []

    this.items$.next(
      this.keys.reduce((acc, item) => ({ ...acc, [item]: undefined }), {})
    )
    if (wasGameOver) {
      this.overlayFadeOutComplete$.pipe(take(1)).subscribe(() => {
        this.scoreSubject$.next(0)
      })
    } else {
      this.scoreSubject$.next(0)
    }
    this.resetCombo()

    this.setActiveItem(undefined)

    this.setProcessing(false)
    this.processData.initializeWithGenerated()
    this.setProcessing(true)
    this.doProcess()
    this.emitGameStateChange()
  }

  /**
   * Applies a batch of prepared tasks through the animation pipeline, updating
   * board rows, items map, score and combo state.
   */
  private applyTask = async (tasks: ReturnType<typeof prepareTasks>) => {
    const versionAtStart = this.applyVersion
    this.setProcessing(true)
    let hasRemoves = false
    const { keysSize: _keysSize, rowsCount } = this.config

    for (let index = 0; index < tasks.length; index++) {
      if (this.applyVersion !== versionAtStart) return
      const task = tasks[index]
      const { step } = task

      if (step === 'gesture' || step === 'idle') continue

      await runTaskApplyPipeline({
        task,
        stepComplete$: this.stepComplete$,
        getStepCompleteTimeout: this.getStepCompleteTimeout.bind(this),
        onScoreUpdate: removedCellsScore => {
          this.applyRemovedCellsScore(removedCellsScore)
          hasRemoves = removedCellsScore > 0
        },
        onApplyState: (nextOverwriteIndex, rows, newItems) => {
          this.nextOverwriteIndex = nextOverwriteIndex
          this.rows = rows
          this.items$.next(newItems)
          this.emitGameStateChange()
        },
        onRowAdded: this.onRowAdded
      })
      if (this.applyVersion !== versionAtStart) return
    }

    if (this.rows.filter(row => row.length).length === rowsCount) {
      this.gameOverSubject$.next({ score: this.scoreSubject$.getValue() })
      this.setProcessing(false)
      this.emitGameStateChange()
      return
    }
    if (this.applyVersion !== versionAtStart) return

    if (!hasRemoves) {
      this.resetCombo()
      this.emitGameStateChange()
    }
    if (this.tempRemoveQueue.size) {
      const newItems = { ...this.items$.getValue() }
      for (const id of this.tempRemoveQueue) {
        newItems[id] = undefined
      }
      this.items$.next(newItems)
      this.tempRemoveQueue.clear()
    }
    this.setProcessing(false)
  }

  private stopProcessing = (): void => {
    this.setProcessing(false)
    const taskQueue = [...this.taskQueue]
    this.taskQueue = []
    const prepared = prepareTasks(
      taskQueue,
      this.items$.getValue(),
      this.nextOverwriteIndex,
      this.config.keysSize
    )
    this.applyTask(prepared)
  }

  private doProcess = (): void => {
    /**
     * Feeds processor jobs into the task queue until an 'idle' step is reached,
     * then hands off to stopProcessing to run the prepared tasks.
     */
    if (!this.processing) return
    while (this.processing) {
      const {
        data: rows,
        toRemove,
        step,
        hasChanges
      } = this.processData.processJob()

      if (step === 'idle') {
        this.taskQueue.push({ step, rows })
        this.stopProcessing()
        return
      }

      if (hasChanges || toRemove?.length || step === 'gesture') {
        this.taskQueue.push({ step, rows, rowsToRemove: toRemove })
      }
    }
  }
}
