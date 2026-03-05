import type { Observable } from 'rxjs'

import type { ActiveItem, PathSegment, PathSegmentExt } from '../model/types'
import { GameViewModel } from './GameViewModel'
import { GestureCoordinator } from './GestureCoordinator'
import type { CompleteEndResult } from './GestureCoordinator'

export interface IGameEngine {
  readonly items$: Observable<Partial<Record<string, PathSegmentExt>>>
  readonly activeItem$: Observable<ActiveItem | undefined>
  readonly score$: Observable<number>
  readonly multiplier$: Observable<number>
  readonly gameOver$: Observable<{ score: number } | null>
  readonly onChangeTranslateX$: Observable<number>
  readonly onCompleteEnd$: Observable<CompleteEndResult>
  readonly otherSubs$: Observable<void>

  restart(): void
  onCompleteGesture(rows: PathSegment[][]): void
  setActiveItem(item?: ActiveItem): void
  removeItem(key: string): void
  getGameOver(): { score: number } | null
  getRows(): PathSegment[][]
  setGestureContainerLayout(layout: { x: number; y: number }): void
  onGestureBegin(payload: { absoluteX: number; absoluteY: number }): void
  onGestureChange(payload: { changeX: number }): void
  onGestureEnd(): void
  onAnimationFinish(): void
}

/**
 * GameEngine - Facade composing GameViewModel + GestureCoordinator.
 * Single entry point for View layer (React-agnostic).
 */
export class GameEngine implements IGameEngine {
  private readonly game: GameViewModel
  private readonly gesture: GestureCoordinator

  readonly items$: Observable<Partial<Record<string, PathSegmentExt>>>
  readonly activeItem$: Observable<ActiveItem | undefined>
  readonly score$: Observable<number>
  readonly multiplier$: Observable<number>
  readonly gameOver$: Observable<{ score: number } | null>
  readonly onChangeTranslateX$: Observable<number>
  readonly onCompleteEnd$: Observable<CompleteEndResult>
  readonly otherSubs$: Observable<void>

  constructor() {
    this.game = new GameViewModel()
    this.gesture = new GestureCoordinator(this.game)

    this.items$ = this.game.onChangeItems$
    this.activeItem$ = this.game.activeItem$
    this.score$ = this.game.score$
    this.multiplier$ = this.game.multiplier$
    this.gameOver$ = this.game.gameOver$
    this.onChangeTranslateX$ = this.gesture.onChangeTranslateX$
    this.onCompleteEnd$ = this.gesture.onCompleteEnd$
    this.otherSubs$ = this.gesture.otherSubs$
  }

  restart(): void {
    this.game.restart()
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

  onGestureChange(payload: { changeX: number }): void {
    this.gesture.onChange(payload)
  }

  onGestureEnd(): void {
    this.gesture.onEnd()
  }

  onAnimationFinish(): void {
    this.gesture.onAnimationFinish()
  }
}
