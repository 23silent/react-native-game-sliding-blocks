import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withTiming } from 'react-native-reanimated'

import { GAME_ROOT } from '../layoutConsts'
import type { PathSegment } from '../../engine'
import { createGameEngine } from '../../engine'
import type { IGameEngine } from '../../engine'
import {
  useEngineBridge,
  useGestureCompletionOrchestrator,
  useSharedValuesMap
} from '../../bridge'
import { computeGameConfig, toEngineConfig } from '../../config'
import type { GameLayoutSettings } from '../../types'
import { useBlocks } from '../hooks/useBlocks'
import { GameCanvas, type BlockRenderMode } from '../GameCanvas'
import type {
  SlidingBlocksAssets,
  SlidingBlocksCallbacks
} from '../SlidingBlocks.types'
import { GameGestureViewEngine } from '../GameGestureView/GameGestureViewEngine'
import { hitTestTopPause } from '../utils/hitTest'
import { hitTestRestart as hitTestGameOverRestart } from '../utils/gameOverHitTest'
import { hitTestPauseOverlay } from '../utils/pauseOverlayHitTest'

const { ACTIONS_BAR_HEIGHT, DIVIDER_HEIGHT } = GAME_ROOT

type GameRootViewProps = {
  /** Game layout config. Required. Host provides (e.g. from persisted settings). */
  config: GameLayoutSettings
  /** Optional pre-created engine. When provided, config must match. Omit to create internally. */
  engine?: IGameEngine
  /** Injectable assets (block images, background). Omit for fallbacks. */
  assets?: SlidingBlocksAssets
  /** Callbacks - host handles sounds, etc. via onRemovingStart, onFitComplete. */
  callbacks?: SlidingBlocksCallbacks
  onMenuPress?: () => void
  blockRenderMode?: BlockRenderMode
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export const GameRootView = memo(function GameRootView({
  config: layoutConfig,
  engine: engineProp,
  assets,
  callbacks = {},
  onMenuPress,
  blockRenderMode = 'image',
  onLoadProgress,
  onLoadComplete
}: GameRootViewProps): React.JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isPausedRef = useRef(false)
  const config = useMemo(
    () => computeGameConfig(layoutConfig, screenWidth),
    [layoutConfig, screenWidth]
  )

  const [engine] = useState(() =>
    engineProp ?? createGameEngine(toEngineConfig(config))
  )
  const shared = useSharedValuesMap(config)
  const blockImages = assets?.blockImages
  const hasBlockImages =
    !!blockImages && Object.keys(blockImages).length > 0
  const block = useBlocks(blockImages)
  const showFinishOption = !!onMenuPress

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
  }, [engine])

  const orchestrator = useGestureCompletionOrchestrator({
    onComplete,
    onOverlayFadeOutComplete
  })

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  useEngineBridge(engine, shared, {
    orchestrator,
    config,
    onRemovingStart: (p) => callbacksRef.current.onRemovingStart?.(p),
    onRemovingEnd: (p) => callbacksRef.current.onRemovingEnd?.(p),
    onFitStart: () => callbacksRef.current.onFitStart?.(),
    onFitComplete: (p) => callbacksRef.current.onFitComplete?.(p)
  })

  const hidePauseOverlay = useCallback(() => {
    isPausedRef.current = false
    shared.overlay.pauseOpacity.value = withTiming(0, { duration: 200 })
  }, [shared.overlay.pauseOpacity])

  const handleTapOrRestart = useCallback(
    (x: number, y: number): boolean => {
      // When pause overlay is visible, handle overlay button taps
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
          return true
        }
        if (action === 'finish') {
          onMenuPress?.()
          hidePauseOverlay()
          return true
        }
        // Tap elsewhere on overlay - stay paused
        return true
      }

      if (hitTestTopPause(x, y, layout)) {
        isPausedRef.current = true
        shared.overlay.pauseOpacity.value = withTiming(1, { duration: 200 })
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
        return true
      }
      return false
    },
    [
      engine,
      layout,
      onMenuPress,
      showFinishOption,
      shared.overlay.pauseOpacity,
      hidePauseOverlay
    ]
  )

  return (
    <GameGestureViewEngine
      engine={engine}
      shared={shared}
      layout={layout}
      onTapOrRestart={handleTapOrRestart}
    >
      <GameCanvas
        shared={shared}
        layout={layout}
        config={config}
        block={block}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        backgroundImage={assets?.backgroundImage}
        hasBlockImages={hasBlockImages}
        showFinishOption={showFinishOption}
        blockRenderMode={blockRenderMode}
        onLoadProgress={onLoadProgress}
        onLoadComplete={onLoadComplete}
      />
    </GameGestureViewEngine>
  )
})
