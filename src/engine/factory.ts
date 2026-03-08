import type { EngineConfig } from './config'
import type { GameEngineHost } from './host'
import type { PathSegment } from './model/types'
import type { GameStateSnapshot } from './state'
import { GameEngine } from './viewmodels/GameEngine'

export type AnimOverrides = {
  removeFadeMs?: number
  itemDropMs?: number
}

export type CreateGameEngineOptions = {
  onRowAdded?: (row: PathSegment[]) => void
  /** Override animation durations used for step-complete timeouts. */
  animOverrides?: AnimOverrides
  /** Restore from persisted state. Pass state from host storage to resume. */
  initialState?: GameStateSnapshot
  /** Called when state changes. Host should persist the snapshot (e.g. AsyncStorage). */
  onGameStateChange?: (state: GameStateSnapshot) => void
}

/**
 * Creates a game engine instance.
 * @param config - Engine configuration (rows, columns, keys, cellSize)
 * @param host - Optional host (unused; kept for compatibility)
 * @param options - Optional callbacks, animOverrides, initialState, onGameStateChange
 */
export function createGameEngine(
  config: EngineConfig,
  host?: GameEngineHost,
  options?: CreateGameEngineOptions
): GameEngine {
  return new GameEngine(config, host, options)
}
