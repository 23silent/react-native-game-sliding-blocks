/**
 * Sliding Blocks Game SDK
 *
 * Pure game logic - no React, no React Native, no UI dependencies.
 * Use createGameEngine() and connect via your bridge (e.g. useEngineBridge).
 */

export { GameEngine, type IGameEngine } from './viewmodels/GameEngine'
export type { CompleteEndResult, GestureBounds } from './viewmodels/GestureCoordinator'
export { createGameEngine } from './factory'
export type { EngineConfig } from './config'
export type { GameEngineHost } from './host'
export {
  SegmentState,
  isIdleSlot
} from './model/types'
export type {
  PathSegment,
  PathSegmentExt,
  ActiveItem,
  ItemsMap,
  BlockMap
} from './model/types'
export { ANIM } from './model/animConsts'
