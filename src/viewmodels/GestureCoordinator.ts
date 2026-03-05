import {
  filter,
  map,
  merge,
  Observable,
  share,
  Subject,
  tap,
  withLatestFrom
} from 'rxjs'

import { CELL_SIZE, COLUMNS_COUNT } from '../model/consts'
import type { PathSegment } from '../model/types'
import { mapToVoid } from '../core/binding'

export interface IRootForGesture {
  getRows(): PathSegment[][]
  getBusy(): boolean
  setActiveItem(
    item?: { id: string; width: number; left: number; top: number; color: string }
  ): void
}

export type CompleteEndResult = { to: number; updated?: PathSegment[][] }

type Layout = { x: number; y: number }
type BeginGesture = { absoluteX: number; absoluteY: number }
type ChangeGesture = { changeX: number }
type MinMax = { min: number; max: number }
type TranslationResult = { newX: number }

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * GestureCoordinator - ViewModel for gesture interaction.
 * Translates pan/tap into translateX and complete-end events.
 */
export class GestureCoordinator {
  readonly onChangeTranslateX$: Observable<number>
  readonly onCompleteEnd$: Observable<CompleteEndResult>
  readonly otherSubs$: Observable<void>

  private containerLayout: Layout | undefined = undefined
  private readonly changeValues$ = new Subject<ChangeGesture>()
  private readonly endValues$ = new Subject<void>()
  private minMax: MinMax | undefined = undefined
  private activeItemCoords:
    | { rowIndex: number; cellIndex: number }
    | undefined = undefined
  private readonly translateX$ = new Subject<number>()

  constructor(private readonly root: IRootForGesture) {
    this.onChangeTranslateX$ = this.translateX$.asObservable()

    const onCompleteEnd$ = new Subject<CompleteEndResult>()
    this.onCompleteEnd$ = onCompleteEnd$.asObservable()

    this.otherSubs$ = merge(
      this.changeValues$.pipe(
        filter(
          () =>
            !!this.activeItemCoords && !this.root.getBusy() && !!this.minMax
        ),
        withLatestFrom(this.translateX$),
        map(
          ([{ changeX }, current]): TranslationResult => ({
            newX: clamp(
              current + changeX * 1.25,
              this.minMax!.min * CELL_SIZE,
              this.minMax!.max * CELL_SIZE
            )
          })
        ),
        tap(({ newX }) => this.translateX$.next(newX))
      ),
      this.endValues$.pipe(
        withLatestFrom(this.translateX$),
        filter(
          () =>
            !!this.activeItemCoords && !this.root.getBusy() && !!this.minMax
        ),
        map(([_, currentTranslateX]): CompleteEndResult => {
          const to = clamp(
            Math.round(currentTranslateX / CELL_SIZE),
            this.minMax!.min,
            this.minMax!.max
          )
          return {
            to,
            updated:
              to === 0
                ? undefined
                : this.applyTranslation(
                    this.root.getRows(),
                    this.activeItemCoords!.rowIndex,
                    this.activeItemCoords!.cellIndex,
                    to
                  )
          }
        }),
        tap(result => onCompleteEnd$.next(result))
      )
    ).pipe(mapToVoid(), share())
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

    const yOffset = gesture.absoluteY - layout.y
    const xOffset = gesture.absoluteX - layout.x

    const rowIndex = Math.floor(yOffset / CELL_SIZE)
    const colIndex = Math.floor(xOffset / CELL_SIZE)

    const row = this.root.getRows()[rowIndex]
    const itemIndex = row?.findIndex(
      item => colIndex >= item.start && colIndex < item.end
    )
    const item = row?.[itemIndex]
    if (!item) return

    const width = (item.end - item.start) * CELL_SIZE
    const min =
      itemIndex === 0 ? 0 - item.start : row[itemIndex - 1].end - item.start
    const max =
      itemIndex === row.length - 1
        ? COLUMNS_COUNT - item.end
        : row[itemIndex + 1].start - item.end

    this.minMax = { min, max }
    this.activeItemCoords = { rowIndex, cellIndex: itemIndex }

    this.root.setActiveItem({
      id: item.id,
      width,
      left: item.start * CELL_SIZE,
      top: rowIndex * CELL_SIZE,
      color: item.color
    })

    this.translateX$.next(0)
  }

  onChange(e: ChangeGesture): void {
    this.changeValues$.next(e)
  }

  onEnd(): void {
    this.endValues$.next()
  }

  onAnimationFinish(): void {
    this.translateX$.next(0)
    this.minMax = undefined
    this.activeItemCoords = undefined
    this.root.setActiveItem(undefined)
  }
}
