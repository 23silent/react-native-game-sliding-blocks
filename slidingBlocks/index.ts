/**
 * Sliding Blocks game module.
 * Declarative API: <SlidingBlocks config={...} callbacks={...} />
 * No persistence - host provides config and handles callbacks.
 */
export { SlidingBlocks } from './ui/SlidingBlocks'
export { PreloaderOverlay } from './ui/PreloaderOverlay'
export * from './engine'
export * from './ui/layoutConsts'
export { GESTURE_SENSITIVITY } from './ui/consts'
export { scheduleIdle, cancelIdle } from './ui/utils/scheduleIdle'
export type {
  SlidingBlocksConfig,
  SlidingBlocksCallbacks,
  SlidingBlocksHandle,
  RemovingPayload,
  FitCompletePayload,
  SlidingBlocksSettingsOverrides,
  SlidingBlocksProps,
  SlidingBlocksTheme,
  SlidingBlocksAssets,
  BlockImagesMap,
  ImageSource,
  BlockTheme,
  BlockFillMode
} from './ui/SlidingBlocks.types'
export { GameRootView } from './ui/GameRootView'
export {
  useSlidingBlocks,
  type UseSlidingBlocksReturn,
  type GameAreaProps
} from './ui/hooks/useSlidingBlocks'
export {
  useComposableSlidingBlocksContext,
  type ComposableSlidingBlocksContextValue
} from './ui/ComposableSlidingBlocksContext'
export {
  createGameEngine,
  type IGameEngine,
  type EngineConfig,
  type GameEngineHost
} from './engine'
