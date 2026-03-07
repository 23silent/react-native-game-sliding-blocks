import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withTiming } from 'react-native-reanimated'

import { GAME_ROOT } from './layoutConsts'
import type { PathSegment } from '../engine'
import { createGameEngine } from '../engine'
import {
  useEngineBridge,
  useGestureCompletionOrchestrator,
  useSharedValuesMap
} from '../bridge'
import { computeGameConfig, toEngineConfig } from '../config'
import { useBlocks } from './hooks/useBlocks'
import { GameCanvas, type BlockRenderMode } from './GameCanvas'
import { GameGestureViewEngine } from './GameGestureView/GameGestureViewEngine'
import { hitTestTopPause } from './utils/hitTest'
import { hitTestRestart as hitTestGameOverRestart } from './utils/gameOverHitTest'
import { hitTestPauseOverlay } from './utils/pauseOverlayHitTest'
import { SlidingBlocksProvider } from './SlidingBlocksContext'
import { mergeSettings } from './defaults'
import {
  DEFAULT_SLIDING_BLOCKS_THEME,
  type SlidingBlocksHandle,
  type SlidingBlocksProps
} from './SlidingBlocks.types'
import { mergeTheme, noop } from './utils/theme'

const { ACTIONS_BAR_HEIGHT, DIVIDER_HEIGHT } = GAME_ROOT

const SlidingBlocksInner = memo(
  forwardRef<SlidingBlocksHandle, SlidingBlocksProps>(function SlidingBlocksInner(
    {
      config: layoutConfig,
      engine: engineProp,
      assets,
      theme: themeOverrides,
      callbacks = {},
      settings: settingsOverrides,
      blockRenderMode = 'skia',
      showFinishOption = false,
      onLoadProgress,
      onLoadComplete
    },
    ref
  ): React.JSX.Element {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isPausedRef = useRef(false)

  const config = useMemo(
    () => computeGameConfig(layoutConfig, screenWidth),
    [layoutConfig, screenWidth]
  )

  const settings = useMemo(
    () => mergeSettings(settingsOverrides),
    [settingsOverrides]
  )

  const theme = useMemo(
    () => mergeTheme(DEFAULT_SLIDING_BLOCKS_THEME, themeOverrides),
    [themeOverrides]
  )

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  const [engine] = useState(() =>
    engineProp ?? createGameEngine(toEngineConfig(config))
  )
  const shared = useSharedValuesMap(config)
  const blockImages = assets?.blockImages
  const hasBlockImages =
    !!blockImages && Object.keys(blockImages).length > 0
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

  useImperativeHandle(ref, () => ({
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
  }), [engine, hidePauseOverlay, shared.overlay.pauseOpacity])

  const handleTapOrRestart = useCallback(
    (x: number, y: number): boolean => {
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
          callbacksRef.current.onFinish?.()
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
      shared.overlay.pauseOpacity,
      hidePauseOverlay,
      config.gameWidth,
      config.gameHeight
    ]
  )

  const contextValue = useMemo(
    () => ({
      config,
      settings,
      theme,
      callbacks: {
        onScoreChange: callbacks.onScoreChange ?? noop,
        onGameOver: callbacks.onGameOver ?? noop,
        onPause: callbacks.onPause ?? noop,
        onResume: callbacks.onResume ?? noop,
        onRestart: callbacks.onRestart ?? noop,
        onFinish: callbacks.onFinish ?? noop,
        onGestureStart: callbacks.onGestureStart ?? noop,
        onGestureEnd: callbacks.onGestureEnd ?? noop,
        onRemovingStart: callbacks.onRemovingStart ?? noop,
        onRemovingEnd: callbacks.onRemovingEnd ?? noop,
        onFitStart: callbacks.onFitStart ?? noop,
        onFitComplete: callbacks.onFitComplete ?? (() => {})
      },
      showFinishOption
    }),
    [config, settings, theme, callbacks, showFinishOption]
  )

  return (
    <SlidingBlocksProvider value={contextValue}>
      <GameGestureViewEngine
        engine={engine}
        shared={shared}
        layout={layout}
        onTapOrRestart={handleTapOrRestart}
        onGestureStart={callbacks.onGestureStart}
        onGestureEnd={callbacks.onGestureEnd}
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
    </SlidingBlocksProvider>
  )
  })
)

export const SlidingBlocks = forwardRef<SlidingBlocksHandle, SlidingBlocksProps>(
  (props, ref) => <SlidingBlocksInner {...props} ref={ref} />
)
SlidingBlocks.displayName = 'SlidingBlocks'
