import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withTiming } from 'react-native-reanimated'

import { GAME_ROOT, TOP_PAUSE } from '../../model/layoutConsts'
import type { PathSegment } from '../../model/types'
import {
  GameEngine,
  useEngineBridge,
  useGestureCompletionOrchestrator,
  useSharedValuesMap
} from '../../engine'
import { useBlocks } from '../../hooks/useBlocks'
import { useGameConfig } from '../../hooks/useGameConfig'
import { GameCanvas, type BlockRenderMode } from '../GameCanvas'
import { GameGestureViewEngine } from '../GameGestureView/GameGestureViewEngine'
import { hitTestRestart as hitTestGameOverRestart } from '../../utils/gameOverHitTest'
import { hitTestPauseOverlay } from '../../utils/pauseOverlayHitTest'

const { ACTIONS_BAR_HEIGHT, DIVIDER_HEIGHT } = GAME_ROOT

const getTopPauseBounds = (layout: {
  contentTop: number
  actionsBarLeft: number
}) => ({
  left: layout.actionsBarLeft + TOP_PAUSE.LEFT_OFFSET,
  right: layout.actionsBarLeft + TOP_PAUSE.LEFT_OFFSET + TOP_PAUSE.WIDTH,
  top: layout.contentTop + TOP_PAUSE.TOP_OFFSET,
  bottom: layout.contentTop + TOP_PAUSE.TOP_OFFSET + TOP_PAUSE.HEIGHT
})

const hitTestTopPause = (
  x: number,
  y: number,
  layout: { contentTop: number; actionsBarLeft: number }
): boolean => {
  const b = getTopPauseBounds(layout)
  return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom
}

type GameRootViewProps = {
  onMenuPress?: () => void
  /** 'image' (default) = PNG assets; 'skia' = draw blocks with Skia primitives (no assets) */
  blockRenderMode?: BlockRenderMode
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export const GameRootView = memo(function GameRootView({
  onMenuPress,
  blockRenderMode = 'image',
  onLoadProgress,
  onLoadComplete
}: GameRootViewProps = {}): React.JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isPausedRef = useRef(false)
  const config = useGameConfig()

  const [engine] = useState(() => new GameEngine(config))
  const shared = useSharedValuesMap(config)
  const block = useBlocks()
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

  useEngineBridge(engine, shared, { orchestrator, config })

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
        showFinishOption={showFinishOption}
        blockRenderMode={blockRenderMode}
        onLoadProgress={onLoadProgress}
        onLoadComplete={onLoadComplete}
      />
    </GameGestureViewEngine>
  )
})
