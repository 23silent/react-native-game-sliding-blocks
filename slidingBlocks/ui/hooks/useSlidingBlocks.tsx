import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { withTiming } from 'react-native-reanimated'

import { GAME_ROOT } from '../layoutConsts'
import type { PathSegment } from '../../engine'
import { createGameEngine } from '../../engine'
import {
  useEngineBridge,
  useGestureCompletionOrchestrator,
  useSharedValuesMap
} from '../../bridge'
import { computeGameConfig, toEngineConfig } from '../../config'
import { useBlocks } from './useBlocks'
import { GameGestureViewEngine } from '../GameGestureView/GameGestureViewEngine'
import { hitTestTopPause } from '../utils/hitTest'
import { hitTestRestart as hitTestGameOverRestart } from '../utils/gameOverHitTest'
import { hitTestPauseOverlay } from '../utils/pauseOverlayHitTest'
import { SlidingBlocksProvider } from '../SlidingBlocksContext'
import { ComposableSlidingBlocksProvider } from '../ComposableSlidingBlocksContext'
import { mergeSettings } from '../defaults'
import {
  DEFAULT_SLIDING_BLOCKS_THEME,
  type SlidingBlocksHandle,
  type SlidingBlocksProps
} from '../SlidingBlocks.types'
import { mergeTheme, noop } from '../utils/theme'
import { ScoreBarCanvas } from '../GameCanvas/ScoreBarCanvas'
import { GameAreaCanvas } from '../GameCanvas/GameAreaCanvas'
import type { BlockRenderMode } from '../GameCanvas'

const { ACTIONS_BAR_HEIGHT, DIVIDER_HEIGHT } = GAME_ROOT

/** Props for the GameArea component returned by useSlidingBlocks. */
export type GameAreaProps = {
  blockRenderMode?: BlockRenderMode
  showFinishOption?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}

export type UseSlidingBlocksReturn = {
  /** Wrapper - provides context and gesture handling. Must wrap ScoreBar and GameArea. */
  Root: React.FC<{ children: React.ReactNode }>
  /** Default score bar - Skia Canvas. Render inside Root. */
  ScoreBar: React.FC
  /** Game area - Skia Canvas (blocks, grid, overlays). Render inside Root. */
  GameArea: React.FC<GameAreaProps>
  /** Imperative handle - pause, resume, restart, isPaused. */
  ref: React.RefObject<SlidingBlocksHandle | null>
  /**
   * Layout and shared values are available inside Root via useComposableSlidingBlocksContext().
   * Use that hook when building custom layouts or score bars.
   */
}

/**
 * Internal provider - runs hook logic. Stable component so children don't remount
 * when block/other deps change (which would reset loading progress).
 */
function SlidingBlocksDataProvider({
  props: hookProps,
  children,
  imperativeRef
}: {
  props: SlidingBlocksProps
  children: React.ReactNode
  imperativeRef: React.MutableRefObject<SlidingBlocksHandle | null>
}) {
  const {
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
  } = hookProps

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

  useEffect(() => {
    imperativeRef.current = {
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
    }
    return () => {
      imperativeRef.current = null
    }
  }, [engine, hidePauseOverlay, shared.overlay.pauseOpacity, imperativeRef])

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

  const composableContextValue = useMemo(
    () => ({
      shared,
      layout,
      config,
      block,
      hasBlockImages,
      screenWidth,
      screenHeight
    }),
    [shared, layout, config, block, hasBlockImages, screenWidth, screenHeight]
  )

  return (
    <SlidingBlocksProvider value={contextValue}>
      <ComposableSlidingBlocksProvider value={composableContextValue}>
        <GameGestureViewEngine
          engine={engine}
          shared={shared}
          layout={layout}
          onTapOrRestart={handleTapOrRestart}
          onGestureStart={hookProps.callbacks?.onGestureStart}
          onGestureEnd={hookProps.callbacks?.onGestureEnd}
        >
          {children}
        </GameGestureViewEngine>
      </ComposableSlidingBlocksProvider>
    </SlidingBlocksProvider>
  )
}

/** Stable Root component - does not remount when parent re-renders. */
function SlidingBlocksComposableRoot({
  props,
  children,
  imperativeRef
}: {
  props: SlidingBlocksProps
  children: React.ReactNode
  imperativeRef: React.MutableRefObject<SlidingBlocksHandle | null>
}) {
  return (
    <SlidingBlocksDataProvider props={props} imperativeRef={imperativeRef}>
      {children}
    </SlidingBlocksDataProvider>
  )
}

/**
 * Non-declarative API for SlidingBlocks. Returns composable pieces: Root, ScoreBar, GameArea, ref.
 * Use when you need custom layout or a custom score bar.
 *
 * Layout dimensions and shared values are only available inside Root.
 * Call useComposableSlidingBlocksContext() within Root's children to get layout, shared, config, block.
 */
export function useSlidingBlocks(
  props: SlidingBlocksProps
): UseSlidingBlocksReturn {
  const ref = useRef<SlidingBlocksHandle | null>(null)
  const propsRef = useRef(props)
  propsRef.current = props

  const Root = useCallback(
    (rootProps: { children: React.ReactNode }) => (
      <SlidingBlocksComposableRoot
        props={propsRef.current}
        imperativeRef={ref}
      >
        {rootProps.children}
      </SlidingBlocksComposableRoot>
    ),
    []
  )

  const ScoreBar = useMemo(
    () =>
      function SlidingBlocksScoreBar(): React.JSX.Element {
        return <ScoreBarCanvas />
      },
    []
  )

  const defaultGameAreaPropsRef = useRef({
    blockRenderMode: props.blockRenderMode ?? 'skia',
    showFinishOption: props.showFinishOption ?? false,
    onLoadProgress: props.onLoadProgress,
    onLoadComplete: props.onLoadComplete
  })
  defaultGameAreaPropsRef.current = {
    blockRenderMode: props.blockRenderMode ?? 'skia',
    showFinishOption: props.showFinishOption ?? false,
    onLoadProgress: props.onLoadProgress,
    onLoadComplete: props.onLoadComplete
  }

  const GameArea = useMemo(
    () =>
      function SlidingBlocksGameArea(
        gameAreaProps?: GameAreaProps
      ): React.JSX.Element {
        const d = defaultGameAreaPropsRef.current
        return (
          <GameAreaCanvas
            blockRenderMode={gameAreaProps?.blockRenderMode ?? d.blockRenderMode}
            showFinishOption={
              gameAreaProps?.showFinishOption ?? d.showFinishOption
            }
            onLoadProgress={gameAreaProps?.onLoadProgress ?? d.onLoadProgress}
            onLoadComplete={gameAreaProps?.onLoadComplete ?? d.onLoadComplete}
          />
        )
      },
    []
  )

  return { Root, ScoreBar, GameArea, ref }
}
