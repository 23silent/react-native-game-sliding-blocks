/**
 * Configuration for the game logic SDK.
 * Contains only logic-related fields. UI layout (cellSize, gameWidth, etc.)
 * is derived by the host from screen dimensions.
 */
export type EngineConfig = {
  rowsCount: number
  columnsCount: number
  keysSize: number
  keys: string[]
  /** Pixels per logical column - needed for gesture bounds and input mapping */
  cellSize: number
}
