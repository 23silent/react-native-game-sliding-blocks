import SoundPlayer from 'react-native-sound-player'
import { BehaviorSubject, Observable, Subject } from 'rxjs'

import { KEYS, ROWS_COUNT } from '../model/consts'
import { ProcessData } from '../model/ProcessData'
import { prepareTasks } from '../model/prepareTasks'
import type {
  ActiveItem,
  PathSegment,
  PathSegmentExt,
  TaskQueueItem
} from '../model/types'
import { delay } from '../utils/delay'
import { nop } from '../utils/nop'

/**
 * GameViewModel - Main game presentation logic.
 * Orchestrates ProcessData (model), exposes RxJS streams for the View.
 */
export class GameViewModel {
  private taskQueue: TaskQueueItem[] = []
  private tempRemoveQueue: Set<string> = new Set()
  private nextOverwriteIndex = 0
  private busy = false
  private rows: PathSegment[][] = []
  private applyVersion = 0
  private comboStreak = 0

  readonly items$ = new BehaviorSubject<Partial<Record<string, PathSegmentExt>>>(
    KEYS.reduce((acc, item) => ({ ...acc, [item]: undefined }), {})
  )
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

  constructor() {
    SoundPlayer.loadSoundFile('small', 'mp3')
    SoundPlayer.loadSoundFile('big', 'mp3')

    this.processData = new ProcessData()
    this.activeItem$ = this.activeItemSubject$.asObservable()
    this.score$ = this.scoreSubject$.asObservable()
    this.multiplier$ = this.multiplierSubject$.asObservable()
    this.gameOver$ = this.gameOverSubject$.asObservable()
    this.onChangeItems$ = this.items$.asObservable()

    this.processData.initializeWithGenerated()
    this.setBusy(true)
    this.doProcess()
  }

  getGameOver = (): { score: number } | null =>
    this.gameOverSubject$.getValue()

  getRows = (): PathSegment[][] => this.rows
  getBusy = (): boolean => this.busy

  setBusy = (busy: boolean): void => {
    this.busy = busy
  }

  setActiveItem = (item?: ActiveItem): void =>
    this.activeItemSubject$.next(item)

  removeItem = (key: string): void => {
    this.tempRemoveQueue.add(key)
  }

  onCompleteGesture = (rows: PathSegment[][]): void => {
    this.setBusy(true)
    this.processData.setSegments(rows, 'gesture')
    this.doProcess()
  }

  restart = (): void => {
    this.gameOverSubject$.next(null)
    this.applyVersion++
    this.taskQueue = []
    this.tempRemoveQueue.clear()
    this.nextOverwriteIndex = 0
    this.rows = []

    this.items$.next(
      KEYS.reduce((acc, item) => ({ ...acc, [item]: undefined }), {})
    )
    this.scoreSubject$.next(0)
    this.multiplierSubject$.next(1)
    this.comboStreak = 0

    this.setActiveItem(undefined)

    this.setBusy(false)
    this.processData.initializeWithGenerated()
    this.setBusy(true)
    this.doProcess()
  }

  private applyTask = async (tasks: ReturnType<typeof prepareTasks>) => {
    const versionAtStart = this.applyVersion
    this.setBusy(true)

    let hasRemoves = false
    for (let index = 0; index < tasks.length; index++) {
      if (this.applyVersion !== versionAtStart) return

      const {
        rows,
        newState: newItems,
        step,
        nextOverwriteIndex,
        score,
        playRemoveSound = true
      } = tasks[index]

      if (step === 'gesture') {
        try {
          SoundPlayer.playSoundFile('small', 'mp3')
        } catch {
          nop()
        }
        continue
      }

      if (step === 'idle') continue

      if (step === 'remove') {
        if (playRemoveSound) {
          try {
            SoundPlayer.playSoundFile('big', 'mp3')
          } catch {
            nop()
          }
        }
        if (score > 0) {
          this.comboStreak++
          const multiplier = Math.min(this.comboStreak, 5)
          const scoreGained = score * multiplier
          this.scoreSubject$.next(this.scoreSubject$.getValue() + scoreGained)
          this.multiplierSubject$.next(multiplier)
          hasRemoves = true
        }
      }

      this.nextOverwriteIndex = nextOverwriteIndex
      this.rows = rows
      this.items$.next(newItems)

      if (step === 'fit' || step === 'add') {
        await delay(250)
      } else {
        await delay(50)
      }
      if (this.applyVersion !== versionAtStart) return
    }

    if (this.rows.filter(row => row.length).length === ROWS_COUNT) {
      this.gameOverSubject$.next({ score: this.scoreSubject$.getValue() })
      this.setBusy(false)
      return
    }

    if (this.applyVersion !== versionAtStart) return

    if (!hasRemoves) {
      this.comboStreak = 0
      this.multiplierSubject$.next(1)
    }

    if (this.tempRemoveQueue.size) {
      const newItems = { ...this.items$.getValue() }
      for (const id of this.tempRemoveQueue) {
        newItems[id] = undefined
      }
      this.items$.next(newItems)
      this.tempRemoveQueue.clear()
    }
    this.setBusy(false)
  }

  private stopProcessing = (): void => {
    this.setBusy(false)
    const taskQueue = [...this.taskQueue]
    this.taskQueue = []
    this.applyTask(
      prepareTasks(taskQueue, this.items$.getValue(), this.nextOverwriteIndex)
    )
  }

  private doProcess = (): void => {
    if (!this.busy) return

    while (this.busy) {
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
