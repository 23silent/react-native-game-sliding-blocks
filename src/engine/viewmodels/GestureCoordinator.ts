import { filter, map, Observable, share, Subject, tap } from 'rxjs'

import { mapToVoid } from '../core/binding'
import type { Board } from '../model/types'
import { translateSegmentOnBoard } from '../model/transform'

export interface IRootForGesture {
  getRows(): Board
  isProcessing(): boolean
  setActiveItem(
    item?: { id: string; width: number; left: number; top: number; color: string }
  ): void
}

export type CompleteEndResult = { to: number; updated?: Board }

export type GestureBounds = { minPx: number; maxPx: number }

type Layout = { x: number; y: number }
type BeginGesture = { absoluteX: number; absoluteY: number }
type MinMax = { min: number; max: number }

export type GestureCoordinatorConfig = {
  cellSize: number
  columnsCount: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * GestureCoordinator - ViewModel for gesture interaction.
 * Translates pan/tap into translateX and complete-end events.
 */
export class GestureCoordinator {
  readonly onChangeTranslateX$: Observable<number>
  readonly onCompleteEnd$: Observable<CompleteEndResult>
  readonly gestureBounds$: Observable<GestureBounds | null>
  readonly gesturePipeline$: Observable<void>

  private containerLayout: Layout | undefined = undefined
  private readonly endValues$ = new Subject<number>()
  private minMax: MinMax | undefined = undefined
  private activeItemCoords:
    | { rowIndex: number; cellIndex: number }
    | undefined = undefined
  private readonly translateX$ = new Subject<number>()
  private readonly gestureBoundsSubject$ = new Subject<GestureBounds | null>()

  constructor(
    private readonly root: IRootForGesture,
    private readonly config: GestureCoordinatorConfig
  ) {
    const { cellSize, columnsCount: _columnsCount } = config

    this.onChangeTranslateX$ = this.translateX$.asObservable()
    this.gestureBounds$ = this.gestureBoundsSubject$.asObservable()

    const onCompleteEnd$ = new Subject<CompleteEndResult>()
    this.onCompleteEnd$ = onCompleteEnd$.asObservable()

    this.gesturePipeline$ = this.endValues$.pipe(
      filter(
        () =>
          !!this.activeItemCoords && !this.root.isProcessing() && !!this.minMax
      ),
      map((currentTranslateX: number): CompleteEndResult => {
        const movementBounds = this.minMax!
        const activeItemPosition = this.activeItemCoords!
        const to = clamp(
          Math.round(currentTranslateX / cellSize),
          movementBounds.min,
          movementBounds.max
        )
        return {
          to,
          updated:
            to === 0
              ? undefined
              : translateSegmentOnBoard(
                  this.root.getRows(),
                  activeItemPosition.rowIndex,
                  activeItemPosition.cellIndex,
                  to
                )
        }
      }),
      tap((result: CompleteEndResult) => onCompleteEnd$.next(result)),
      mapToVoid(),
      share()
    )
  }

  setContainerLayout(layout: Layout): void {
    this.containerLayout = layout
  }

  onBegin(gesture: BeginGesture): void {
    if (this.root.isProcessing()) return
    const layout = this.containerLayout
    if (!layout) return

    const { cellSize, columnsCount } = this.config
    const yOffset = gesture.absoluteY - layout.y
    const xOffset = gesture.absoluteX - layout.x

    const rowIndex = Math.floor(yOffset / cellSize)
    const colIndex = Math.floor(xOffset / cellSize)

    const row = this.root.getRows()[rowIndex]
    const itemIndex = row?.findIndex(
      item => colIndex >= item.start && colIndex < item.end
    )
    const item = row?.[itemIndex]
    if (!item) return

    const width = (item.end - item.start) * cellSize
    const min =
      itemIndex === 0 ? 0 - item.start : row[itemIndex - 1].end - item.start
    const max =
      itemIndex === row.length - 1
        ? columnsCount - item.end
        : row[itemIndex + 1].start - item.end

    this.minMax = { min, max }
    this.activeItemCoords = { rowIndex, cellIndex: itemIndex }

    this.root.setActiveItem({
      id: item.id,
      width,
      left: item.start * cellSize,
      top: rowIndex * cellSize,
      color: item.color
    })

    this.translateX$.next(0)
    this.gestureBoundsSubject$.next({
      minPx: min * cellSize,
      maxPx: max * cellSize
    })
  }

  onEnd(currentTranslateX: number): void {
    this.endValues$.next(currentTranslateX)
  }

  onAnimationFinish(): void {
    this.translateX$.next(0)
    this.gestureBoundsSubject$.next(null)
    this.minMax = undefined
    this.activeItemCoords = undefined
    this.root.setActiveItem(undefined)
  }
}
