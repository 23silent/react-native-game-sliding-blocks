import type { EngineConfig } from '../../slidingBlocks'
import type { GameConfig } from './gameConfig'

/** Converts UI GameConfig to SDK EngineConfig. */
export function toEngineConfig(config: GameConfig): EngineConfig {
  return {
    rowsCount: config.rowsCount,
    columnsCount: config.columnsCount,
    keysSize: config.keysSize,
    keys: config.keys,
    cellSize: config.cellSize
  }
}
