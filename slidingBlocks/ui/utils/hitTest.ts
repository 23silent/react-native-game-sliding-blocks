import { TOP_PAUSE } from '../layoutConsts'

export type TopPauseLayout = {
  contentTop: number
  actionsBarLeft: number
}

/** Bounds of the top pause button for hit-testing. */
export function getTopPauseBounds(layout: TopPauseLayout): {
  left: number
  right: number
  top: number
  bottom: number
} {
  return {
    left: layout.actionsBarLeft + TOP_PAUSE.LEFT_OFFSET,
    right: layout.actionsBarLeft + TOP_PAUSE.LEFT_OFFSET + TOP_PAUSE.WIDTH,
    top: layout.contentTop + TOP_PAUSE.TOP_OFFSET,
    bottom: layout.contentTop + TOP_PAUSE.TOP_OFFSET + TOP_PAUSE.HEIGHT
  }
}

/** Returns true if (x, y) is inside the top pause button hit area. */
export function hitTestTopPause(
  x: number,
  y: number,
  layout: TopPauseLayout
): boolean {
  const b = getTopPauseBounds(layout)
  return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom
}
