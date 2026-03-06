import type { AppSettings, GameLayoutSettings } from './types'

export type GameConfig = {
  rowsCount: number
  columnsCount: number
  padding: number
  keysSize: number
  keys: string[]
  cellSize: number
  gameWidth: number
  gameHeight: number
  explosionPoolSize: number
}

export function computeGameConfig(
  gameLayout: GameLayoutSettings,
  screenWidth: number
): GameConfig {
  const { rowsCount, columnsCount, padding, keysSize, explosionPoolSize } =
    gameLayout
  const size = screenWidth - padding * 2
  const cellSize = size / columnsCount
  const gameWidth = cellSize * columnsCount
  const gameHeight = cellSize * rowsCount
  const keys = Array.from({ length: keysSize }, (_, i) => String(i))

  return {
    rowsCount,
    columnsCount,
    padding,
    keysSize,
    keys,
    cellSize,
    gameWidth,
    gameHeight,
    explosionPoolSize
  }
}
