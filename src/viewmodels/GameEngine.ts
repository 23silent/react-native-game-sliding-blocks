import { Subject } from 'rxjs'
import type { Observable } from 'rxjs'

import type { ActiveItem, PathSegment, PathSegmentExt } from '../model/types'
import type { GameConfig } from '../settings/gameConfig'
import { GameViewModel } from './GameViewModel'
import { GestureCoordinator } from './GestureCoordinator'
import type {
  CompleteEndResult,
  GestureBounds
} from './GestureCoordinator'

export interface IGameEngine {
  readonly items$: Observable<Partial<Record<string, PathSegmentExt>>>
  readonly activeItem$: Observable<ActiveItem | undefined>
  readonly score$: Observable<number>
  readonly multiplier$: Observable<number>
  readonly gameOver$: Observable<{ score: number } | null>
  readonly onChangeTranslateX$: Observable<number>
  readonly onCompleteEnd$: Observable<CompleteEndResult>
  readonly gestureBounds$: Observable<GestureBounds | null>
  readonly gesturePipeline$: Observable<void>
  /** Emits when the current items batch animations have finished. Used to drive the task pipeline. */
  readonly stepComplete$: Observable<void>

  restart(): void
  /** Single entry point when gesture completes (snap animation finished). Applies gesture, starts task pipeline, clears active state. */
  onGestureComplete(updated?: PathSegment[][]): void
  onCompleteGesture(rows: PathSegment[][]): void
  setActiveItem(item?: ActiveItem): void
  removeItem(key: string): void
  getGameOver(): { score: number } | null
  getRows(): PathSegment[][]
  setGestureContainerLayout(layout: { x: number; y: number }): void
  onGestureBegin(payload: { absoluteX: number; absoluteY: number }): void
  onGestureEnd(currentTranslateX: number): void
  onAnimationFinish(): void
  /** Call when items batch animations have settled (from bridge). */
  signalStepComplete(): void
  /** Call when game-over overlay fade-out animation completes (from bridge). */
  signalOverlayFadeOutComplete(): void
}

/**
 * GameEngine - Facade composing GameViewModel + GestureCoordinator.
 * Single entry point for View layer (React-agnostic).
 */
export class GameEngine implements IGameEngine {
  private readonly game: GameViewModel
  private readonly gesture: GestureCoordinator
  private readonly stepCompleteSubject$ = new Subject<void>()
  private readonly overlayFadeOutCompleteSubject$ = new Subject<void>()

  readonly items$: Observable<Partial<Record<string, PathSegmentExt>>>
  readonly activeItem$: Observable<ActiveItem | undefined>
  readonly score$: Observable<number>
  readonly multiplier$: Observable<number>
  readonly gameOver$: Observable<{ score: number } | null>
  readonly onChangeTranslateX$: Observable<number>
  readonly onCompleteEnd$: Observable<CompleteEndResult>
  readonly gestureBounds$: Observable<GestureBounds | null>
  readonly gesturePipeline$: Observable<void>
  readonly stepComplete$: Observable<void>

  constructor(config: GameConfig) {
    this.stepComplete$ = this.stepCompleteSubject$.asObservable()
    this.game = new GameViewModel(
      config,
      this.stepComplete$,
      this.overlayFadeOutCompleteSubject$.asObservable()
    )
    this.gesture = new GestureCoordinator(this.game, {
      cellSize: config.cellSize,
      columnsCount: config.columnsCount
    })

    this.items$ = this.game.onChangeItems$
    this.activeItem$ = this.game.activeItem$
    this.score$ = this.game.score$
    this.multiplier$ = this.game.multiplier$
    this.gameOver$ = this.game.gameOver$
    this.onChangeTranslateX$ = this.gesture.onChangeTranslateX$
    this.onCompleteEnd$ = this.gesture.onCompleteEnd$
    this.gestureBounds$ = this.gesture.gestureBounds$
    this.gesturePipeline$ = this.gesture.gesturePipeline$
  }

  restart(): void {
    this.game.restart()
  }

  onGestureComplete(updated?: PathSegment[][]): void {
    if (updated) {
      this.game.onCompleteGesture(updated)
    }
    this.gesture.onAnimationFinish()
  }

  onCompleteGesture(rows: PathSegment[][]): void {
    this.game.onCompleteGesture(rows)
  }

  setActiveItem(item?: ActiveItem): void {
    this.game.setActiveItem(item)
  }

  removeItem(key: string): void {
    this.game.removeItem(key)
  }

  getGameOver(): { score: number } | null {
    return this.game.getGameOver()
  }

  getRows(): PathSegment[][] {
    return this.game.getRows()
  }

  setGestureContainerLayout(layout: { x: number; y: number }): void {
    this.gesture.setContainerLayout(layout)
  }

  onGestureBegin(payload: { absoluteX: number; absoluteY: number }): void {
    this.gesture.onBegin(payload)
  }

  onGestureEnd(currentTranslateX: number): void {
    this.gesture.onEnd(currentTranslateX)
  }

  onAnimationFinish(): void {
    this.gesture.onAnimationFinish()
  }

  signalStepComplete(): void {
    this.stepCompleteSubject$.next()
  }

  signalOverlayFadeOutComplete(): void {
    this.overlayFadeOutCompleteSubject$.next()
  }
}
