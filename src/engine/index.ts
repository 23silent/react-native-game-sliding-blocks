/**
 * Sliding Blocks Game SDK
 *
 * Pure game logic - no React, no React Native, no UI dependencies.
 * Use createGameEngine() and connect via your bridge (e.g. useEngineBridge).
 */

export type { EngineConfig } from './config'
export {
  type AnimOverrides,
  createGameEngine,
  type CreateGameEngineOptions
} from './factory'
export type { GameEngineHost } from './host'
export { ANIM } from './model/animConsts'
export type {
  ActiveItem,
  BlockMap,
  ItemsMap,
  PathSegment,
  PathSegmentExt} from './model/types'
export { isIdleSlot,SegmentState } from './model/types'
export {
  type GameStateSnapshot,
  getLayoutVersion,
  isSnapshotCompatible} from './state'
export { GameEngine, type IGameEngine } from './viewmodels/GameEngine'
export type { CompleteEndResult, GestureBounds } from './viewmodels/GestureCoordinator'
