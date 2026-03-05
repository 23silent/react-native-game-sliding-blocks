import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  pairwise,
  startWith
} from 'rxjs'

import { CELL_SIZE, ROWS_COUNT } from '../model/consts'
import { SegmentState } from '../model/types'
import type { PathSegmentExt } from '../model/types'
import { nop } from '../utils/nop'

export interface IItemsSource {
  onChangeItems$: Observable<Partial<Record<string, PathSegmentExt>>>
  activeItem$: Observable<{ id: string } | undefined>
  removeItem(key: string): void
}

type StateValue = {
  yValue: number
  xValue: number
  opacityValue: number
  widthValue: number
  colorValue: string
}

const initialStateValue: StateValue = {
  yValue: ROWS_COUNT * CELL_SIZE,
  xValue: -1 * CELL_SIZE,
  opacityValue: 0,
  widthValue: 0,
  colorValue: '#fff'
}

/**
 * ItemViewModel - Per-slot derived state for item display.
 * Transforms items$ into position, opacity, and lifecycle triggers.
 */
export class ItemViewModel {
  readonly state$: Observable<StateValue>
  readonly willRemoveTrigger$: Observable<void>
  readonly removeTrigger$: Observable<void>
  readonly isActive$: Observable<boolean>

  constructor(
    private readonly itemKey: string,
    private readonly source: IItemsSource
  ) {
    const item$ = this.source.onChangeItems$.pipe(
      map(items => items[this.itemKey]),
      distinctUntilChanged(),
      startWith(undefined)
    )

    this.isActive$ = combineLatest([this.source.activeItem$, item$]).pipe(
      map(
        ([activeItem, item]) =>
          !!activeItem && !!item && activeItem?.id === item?.id
      )
    )

    this.willRemoveTrigger$ = item$.pipe(
      pairwise(),
      filter(
        ([prev, next]) =>
          prev?.state !== SegmentState.WillRemove &&
          next?.state === SegmentState.WillRemove
      ),
      map(nop)
    )

    this.removeTrigger$ = item$.pipe(
      pairwise(),
      filter(
        ([prev, next]) =>
          prev?.state !== SegmentState.Removing &&
          next?.state === SegmentState.Removing
      ),
      map(nop)
    )

    this.state$ = item$.pipe(
      map(item => {
        if (!item || item.state === SegmentState.Idle) return initialStateValue
        return {
          yValue: item.rowIndex * CELL_SIZE,
          xValue: item.start * CELL_SIZE,
          widthValue: (item.end - item.start) * CELL_SIZE,
          opacityValue: 0.8,
          colorValue: item.color
        }
      })
    )
  }

  removeItem = (): void => {
    this.source.removeItem(this.itemKey)
  }
}
