import type { EngineConfig } from './config'
import type { GameEngineHost } from './host'
import { GameEngine } from './viewmodels/GameEngine'

/**
 * Creates a game engine instance.
 * @param config - Engine configuration (rows, columns, keys, cellSize)
 * @param host - Optional host for platform callbacks (e.g. sound)
 */
export function createGameEngine(
  config: EngineConfig,
  host?: GameEngineHost
): GameEngine {
  return new GameEngine(config, host)
}
