/**
 * Shared game root logic for SlidingBlocks, GameRootView, and useSlidingBlocks.
 * Centralizes engine creation, bridge, layout, and tap handling.
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { withTiming } from 'react-native-reanimated'

import {
  useEngineBridge,
  useGestureCompletionOrchestrator,
  useSharedValuesMap
} from '../../bridge'
import { computeGameConfig, toEngineConfig } from '../../config'
import { GAME_ROOT } from '../../constants/layout'
import type { PathSegment } from '../../engine'
import type { IGameEngine } from '../../engine'
import { createGameEngine } from '../../engine'
import type { GameLayout } from '../../types/layout'
import type { GameLayoutSettings } from '../../types/settings'
import type {
  SlidingBlocksAssets,
  SlidingBlocksCallbacks
} from '../SlidingBlocks.types'
import { hitTestRestart as hitTestGameOverRestart } from '../utils/gameOverHitTest'
import { hitTestTopPause } from '../utils/hitTest'
import { hitTestPauseOverlay } from '../utils/pauseOverlayHitTest'
import { useBlocks } from './useBlocks'

const { ACTIONS_BAR_HEIGHT, DIVIDER_HEIGHT } = GAME_ROOT

const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 }

export type UseGameRootOptions = {
  layoutConfig: GameLayoutSettings
  engine?: IGameEngine
  assets?: SlidingBlocksAssets
  callbacks?: SlidingBlocksCallbacks
  showFinishOption?: boolean
  onMenuPress?: () => void
}

export type UseGameRootReturn = {
  engine: IGameEngine
  shared: ReturnType<typeof useSharedValuesMap>
  layout: GameLayout
  config: ReturnType<typeof computeGameConfig>
  block: ReturnType<typeof useBlocks>
  hasBlockImages: boolean
  handleTapOrRestart: (x: number, y: number) => boolean
  hidePauseOverlay: () => void
  isPausedRef: React.MutableRefObject<boolean>
  screenWidth: number
  screenHeight: number
  getImperativeHandle: () => {
    pause: () => void
    resume: () => void
    restart: () => void
    isPaused: () => boolean
  }
}

export function useGameRoot(options: UseGameRootOptions): UseGameRootReturn {
  const {
    layoutConfig,
    engine: engineProp,
    assets,
    callbacks = {},
    showFinishOption = false,
    onMenuPress
  } = options

  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const isPausedRef = useRef(false)
  // Safe area is host responsibility — wrap in SafeAreaView if needed
  const insets = ZERO_INSETS

  const config = useMemo(
    () => computeGameConfig(layoutConfig, screenWidth),
    [layoutConfig, screenWidth]
  )

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const [engine] = useState(() =>
    engineProp ??
    createGameEngine(toEngineConfig(config), undefined, {
      onRowAdded: (row) => callbacksRef.current.onRowAdded?.(row)
    })
  )

  const shared = useSharedValuesMap(config)
  const blockImages = assets?.blockImages
  const hasBlockImages = !!blockImages && Object.keys(blockImages).length > 0
  const block = useBlocks(blockImages)

  const layout = useMemo(() => {
    const { gameHeight, gameWidth, padding } = config
    const contentHeight = ACTIONS_BAR_HEIGHT + DIVIDER_HEIGHT + gameHeight
    const contentTop = Math.max(
      insets.top,
      (screenHeight - insets.top - insets.bottom - contentHeight) / 2 +
        insets.top
    )
    const gameAreaY = contentTop + ACTIONS_BAR_HEIGHT + DIVIDER_HEIGHT
    const gameAreaX = (screenWidth - gameWidth) / 2
    return {
      contentTop,
      gameAreaX,
      gameAreaY,
      actionsBarLeft: padding,
      actionsBarWidth: screenWidth - padding * 2
    }
  }, [config, screenWidth, screenHeight, insets])

  const onComplete = useCallback(
    (updated?: PathSegment[][]) => {
      engine.onGestureComplete(updated)
    },
    [engine]
  )

  const onOverlayFadeOutComplete = useCallback(() => {
    engine.signalOverlayFadeOutComplete()
    callbacksRef.current.onRestart?.()
  }, [engine])

  const orchestrator = useGestureCompletionOrchestrator({
    onComplete,
    onOverlayFadeOutComplete
  })

  useEngineBridge(engine, shared, {
    orchestrator,
    config,
    onScoreChange: (score) => callbacksRef.current.onScoreChange?.(score),
    onGameOver: (score) => callbacksRef.current.onGameOver?.(score),
    onRemovingStart: (p) => callbacksRef.current.onRemovingStart?.(p),
    onRemovingEnd: (p) => callbacksRef.current.onRemovingEnd?.(p),
    onFitStart: () => callbacksRef.current.onFitStart?.(),
    onFitComplete: (p) => callbacksRef.current.onFitComplete?.(p)
  })

  const hidePauseOverlay = useCallback(() => {
    isPausedRef.current = false
    shared.overlay.pauseOpacity.value = withTiming(0, { duration: 200 })
    callbacksRef.current.onResume?.()
  }, [shared.overlay.pauseOpacity])

  const handleTapOrRestart = useCallback(
    (x: number, y: number): boolean => {
      const finishHandler = onMenuPress ?? (() => callbacksRef.current.onFinish?.())

      if (isPausedRef.current) {
        const action = hitTestPauseOverlay(
          x - layout.gameAreaX,
          y - layout.gameAreaY,
          showFinishOption,
          config.gameWidth,
          config.gameHeight
        )
        if (action === 'resume') {
          hidePauseOverlay()
          return true
        }
        if (action === 'restart') {
          engine.restart()
          hidePauseOverlay()
          callbacksRef.current.onRestart?.()
          return true
        }
        if (action === 'finish') {
          finishHandler()
          hidePauseOverlay()
          return true
        }
        return true
      }

      if (hitTestTopPause(x, y, layout)) {
        isPausedRef.current = true
        shared.overlay.pauseOpacity.value = withTiming(1, { duration: 200 })
        callbacksRef.current.onPause?.()
        return true
      }

      const gameOver = engine.getGameOver()
      if (
        gameOver &&
        hitTestGameOverRestart(
          x - layout.gameAreaX,
          y - layout.gameAreaY,
          config.gameWidth,
          config.gameHeight
        )
      ) {
        engine.restart()
        callbacksRef.current.onRestart?.()
        return true
      }
      return false
    },
    [
      engine,
      layout,
      showFinishOption,
      onMenuPress,
      shared.overlay.pauseOpacity,
      hidePauseOverlay,
      config.gameWidth,
      config.gameHeight
    ]
  )

  const getImperativeHandle = useCallback(
    () => ({
      pause: () => {
        isPausedRef.current = true
        shared.overlay.pauseOpacity.value = withTiming(1, { duration: 200 })
        callbacksRef.current.onPause?.()
      },
      resume: hidePauseOverlay,
      restart: () => {
        engine.restart()
        isPausedRef.current = false
        shared.overlay.pauseOpacity.value = withTiming(0, { duration: 200 })
        callbacksRef.current.onRestart?.()
      },
      isPaused: () => isPausedRef.current
    }),
    [engine, hidePauseOverlay, shared.overlay.pauseOpacity]
  )

  return {
    engine,
    shared,
    layout,
    config,
    block,
    hasBlockImages,
    handleTapOrRestart,
    hidePauseOverlay,
    isPausedRef,
    screenWidth,
    screenHeight,
    getImperativeHandle
  }
}
