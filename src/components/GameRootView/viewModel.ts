import SoundPlayer from 'react-native-sound-player'
import { BehaviorSubject, Observable, Subject } from 'rxjs'

import { KEYS, ROWS_COUNT } from '../../consts'
import { ProcessData } from '../../services/processData'
import {
  ActiveItem,
  PathSegment,
  PathSegmentExt,
  TaskQueueItem
} from '../../types'
import { delay } from '../../utils/delay'
import { nop } from '../../utils/nop'
import { prepareTasks } from './helper'

export class RootViewModel {
  private taskQueue: TaskQueueItem[] = []

  private tempRemoveQueue: Set<string> = new Set()
  private nextOverwriteIndex: number = 0

  private busy: boolean = false
  private rows: PathSegment[][] = []

  /** Incremented on restart so in-flight applyTask can bail out */
  private applyVersion: number = 0

  public items$ = new BehaviorSubject<Partial<Record<string, PathSegmentExt>>>(
    KEYS.reduce((acc, item) => ({ ...acc, [item]: undefined }), {})
  )

  private readonly activeItemSubject$ = new Subject<ActiveItem | undefined>()
  public activeItem$: Observable<ActiveItem | undefined>

  private readonly translateXSubject$ = new Subject<number | undefined>()
  public translateX$: Observable<number | undefined>

  public onChangeItems$: Observable<Partial<Record<string, PathSegmentExt>>>

  private readonly scoreSubject$ = new BehaviorSubject<number>(0)
  public score$: Observable<number>
  private readonly multiplierSubject$ = new BehaviorSubject<number>(1)
  public multiplier$: Observable<number>
  private comboStreak = 0

  private readonly gameOverSubject$ = new BehaviorSubject<{ score: number } | null>(
    null
  )
  public gameOver$: Observable<{ score: number } | null>
  getGameOver = (): { score: number } | null =>
    this.gameOverSubject$.getValue()

  private processData: ProcessData

  constructor() {
    SoundPlayer.loadSoundFile('small', 'mp3')
    SoundPlayer.loadSoundFile('big', 'mp3')

    this.processData = new ProcessData()

    this.activeItem$ = this.activeItemSubject$.asObservable()
    this.translateX$ = this.translateXSubject$.asObservable()
    this.score$ = this.scoreSubject$.asObservable()
    this.multiplier$ = this.multiplierSubject$.asObservable()
    this.gameOver$ = this.gameOverSubject$.asObservable()

    this.onChangeItems$ = this.items$.asObservable()

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
        } catch (error) {
          nop()
        }
        continue
      }

      if (step === 'idle') {
        continue
      }

      if (step === 'remove') {
        if (playRemoveSound) {
          try {
            SoundPlayer.playSoundFile('big', 'mp3')
          } catch (error) {
            nop()
          }
        }

        // Update score and combo
        if (score > 0) {
          this.comboStreak++
          const multiplier = Math.min(this.comboStreak, 5) // Cap multiplier to 5
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
      const idsToRemove = Array.from(this.tempRemoveQueue)
      for (const id of idsToRemove) {
        newItems[id] = undefined
      }
      this.items$.next(newItems)
      this.tempRemoveQueue.clear()
    }
    this.setBusy(false)
  }

  private stopProcessing = () => {
    this.setBusy(false)
    const taskQueue = [...this.taskQueue]
    this.taskQueue = []
    this.applyTask(
      prepareTasks(taskQueue, this.items$.getValue(), this.nextOverwriteIndex)
    )
  }

  private doProcess = () => {
    if (!this.busy) {
      return
    }
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

  onCompleteGesture = (rows: PathSegment[][]) => {
    this.setBusy(true)
    this.processData.setSegments(rows, 'gesture')
    this.doProcess()
  }

  restart = () => {
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
    this.setTranslateX(0)

    this.setBusy(false)
    this.processData.initializeWithGenerated()
    this.setBusy(true)
    this.doProcess()
  }

  removeItem = (key: string) => this.tempRemoveQueue.add(key)

  getRows = () => this.rows

  setBusy = (busy: boolean) => {
    this.busy = busy
  }

  getBusy = () => this.busy

  setActiveItem = (item?: ActiveItem) => this.activeItemSubject$.next(item)

  setTranslateX = (value?: number) => this.translateXSubject$.next(value)
}
