import { filter, map, Observable, share, Subject, tap } from 'rxjs'

import { mapToVoid } from '../core/binding'
import type { PathSegment } from '../model/types'

export interface IRootForGesture {
  getRows(): PathSegment[][]
  getBusy(): boolean
  setActiveItem(
    item?: { id: string; width: number; left: number; top: number; color: string }
  ): void
}

export type CompleteEndResult = { to: number; updated?: PathSegment[][] }

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
 *
 * Pan translateX updates during drag are handled on the UI thread via
 * gestureBounds$; only onEnd receives the final translateX from the view layer.
 */
export class GestureCoordinator {
  readonly onChangeTranslateX$: Observable<number>
  readonly onCompleteEnd$: Observable<CompleteEndResult>
  /** Emits gesture bounds (px) on begin, null on end. Used for UI-thread pan updates. */
  readonly gestureBounds$: Observable<GestureBounds | null>
  /**
   * Pipeline for gesture end. Must be subscribed to activate (bridge subscribes).
   */
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
    const { cellSize, columnsCount } = config

    this.onChangeTranslateX$ = this.translateX$.asObservable()
    this.gestureBounds$ = this.gestureBoundsSubject$.asObservable()

    const onCompleteEnd$ = new Subject<CompleteEndResult>()
    this.onCompleteEnd$ = onCompleteEnd$.asObservable()

    this.gesturePipeline$ = this.endValues$.pipe(
      filter(
        () =>
          !!this.activeItemCoords && !this.root.getBusy() && !!this.minMax
      ),
      map((currentTranslateX): CompleteEndResult => {
        const mm = this.minMax!
        const coords = this.activeItemCoords!
        const to = clamp(
          Math.round(currentTranslateX / cellSize),
          mm.min,
          mm.max
        )
        return {
          to,
          updated:
            to === 0
              ? undefined
              : this.applyTranslation(
                  this.root.getRows(),
                  coords.rowIndex,
                  coords.cellIndex,
                  to
                )
        }
      }),
      tap(result => onCompleteEnd$.next(result)),
      mapToVoid(),
      share()
    )
  }

  private applyTranslation(
    data: PathSegment[][],
    rowIndex: number,
    itemIndex: number,
    offset: number
  ): PathSegment[][] {
    const updated = [...data]
    const row = [...data[rowIndex]]
    const item = row[itemIndex]
    row[itemIndex] = {
      ...item,
      start: item.start + offset,
      end: item.end + offset
    }
    updated[rowIndex] = row
    return updated
  }

  setContainerLayout(layout: Layout): void {
    this.containerLayout = layout
  }

  onBegin(gesture: BeginGesture): void {
    if (this.root.getBusy()) return
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

  /**
   * Called when pan ends. Pass current translateX (px) from the view layer.
   */
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
