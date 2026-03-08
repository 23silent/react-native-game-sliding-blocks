import type { Observable } from 'rxjs'
import { Subject } from 'rxjs'

import type { EngineConfig } from '../config'
import type { GameEngineHost } from '../host'
import type { ActiveItem, PathSegment, PathSegmentExt } from '../model/types'
import type { GameStateSnapshot } from '../state'
import { GameViewModel } from './GameViewModel'
import { type CompleteEndResult, type GestureBounds,GestureCoordinator } from './GestureCoordinator'

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
  readonly stepComplete$: Observable<void>

  restart(): void
  onGestureComplete(updated?: PathSegment[][]): void
  onCompleteGesture(rows: PathSegment[][]): void
  setActiveItem(item?: ActiveItem): void
  removeItem(key: string): void
  getGameOver(): { score: number } | null
  getRows(): PathSegment[][]
  /** Returns serializable state for host to persist. Pass back as initialState to resume. */
  getGameState(): GameStateSnapshot
  setGestureContainerLayout(layout: { x: number; y: number }): void
  onGestureBegin(payload: { absoluteX: number; absoluteY: number }): void
  onGestureEnd(currentTranslateX: number): void
  onAnimationFinish(): void
  signalStepComplete(): void
  signalOverlayFadeOutComplete(): void
}

/**
 * GameEngine - Facade composing GameViewModel + GestureCoordinator.
 * Single entry point for View layer (framework-agnostic).
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

  constructor(
    config: EngineConfig,
    host?: GameEngineHost,
    options?: {
      onRowAdded?: (row: PathSegment[]) => void
      animOverrides?: { removeFadeMs?: number; itemDropMs?: number }
      initialState?: GameStateSnapshot
      onGameStateChange?: (state: GameStateSnapshot) => void
    }
  ) {
    this.stepComplete$ = this.stepCompleteSubject$.asObservable()
    this.game = new GameViewModel(
      config,
      this.stepComplete$,
      this.overlayFadeOutCompleteSubject$.asObservable(),
      host,
      options?.onRowAdded,
      options?.animOverrides,
      {
        initialState: options?.initialState,
        onGameStateChange: options?.onGameStateChange
      }
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

  getGameState(): GameStateSnapshot {
    return this.game.getState()
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
