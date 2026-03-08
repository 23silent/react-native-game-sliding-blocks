/**
 * Sliding Blocks game module.
 * Declarative API: <SlidingBlocks config={...} callbacks={...} />
 * No persistence - host provides config and handles callbacks.
 */
export { GESTURE_SENSITIVITY } from './constants/game'
export * from './constants/layout'
export * from './engine'
export {
  type AnimOverrides,
  createGameEngine,
  type EngineConfig,
  type GameEngineHost,
  type IGameEngine
} from './engine'
export {
  type GameStateSnapshot,
  getLayoutVersion,
  isSnapshotCompatible} from './engine'
export type {
  AnimationSettings,
  FeedbackOpacitySettings
} from './types/settings'
export {
  type ComposableSlidingBlocksContextValue,
  useComposableSlidingBlocksContext} from './ui/ComposableSlidingBlocksContext'
export { GameRootView } from './ui/GameRootView'
export {
  type GameAreaProps,
  useSlidingBlocks,
  type UseSlidingBlocksReturn} from './ui/hooks/useSlidingBlocks'
export { PreloaderOverlay } from './ui/PreloaderOverlay'
export { SlidingBlocks } from './ui/SlidingBlocks'
export type {
  BlockFillMode,
  BlockImagesMap,
  BlockTheme,
  FitCompletePayload,
  ImageSource,
  RemovingPayload,
  SlidingBlocksAssets,
  SlidingBlocksCallbacks,
  SlidingBlocksConfig,
  SlidingBlocksHandle,
  SlidingBlocksProps,
  SlidingBlocksSettingsOverrides,
  SlidingBlocksTheme} from './ui/SlidingBlocks.types'
export { cancelIdle, scheduleIdle } from './ui/utils/scheduleIdle'
