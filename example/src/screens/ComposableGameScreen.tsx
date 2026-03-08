import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  cancelIdle,
  PreloaderOverlay,
  scheduleIdle,
  useComposableSlidingBlocksContext,
  useSlidingBlocks
} from 'react-native-sliding-blocks'
import SoundPlayer from 'react-native-sound-player'

import { SLIDING_BLOCKS_ASSETS } from '../assets/slidingBlocksAssets'
import { useSettings } from '../hooks/useSettings'
import { addScore } from '../scoreStore'
import { POST_LOAD_DELAY_MS, SLIDING_BLOCKS_THEME } from '../theme'

type Props = {
  onMenuPress: () => void
}

/** Wrapper that uses layout from context to position GameArea and add background. */
function ComposableGameAreaWithLayout({
  GameArea,
  blockRenderMode,
  onLoadProgress,
  onLoadComplete
}: {
  GameArea: React.FC<{
    blockRenderMode?: 'skia' | 'image'
    showFinishOption?: boolean
    onLoadProgress?: (progress: number) => void
    onLoadComplete?: () => void
  }>
  blockRenderMode: 'skia' | 'image'
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
}) {
  const { layout, config } = useComposableSlidingBlocksContext()
  return (
    <ImageBackground
      source={require('../../assets/bg.jpg')}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    >
      <View
        style={[
          styles.gameAreaContainer,
          {
            left: layout.gameAreaX,
            top: layout.gameAreaY,
            width: config.gameWidth,
            height: config.gameHeight
          }
        ]}
      >
        <GameArea
          blockRenderMode={blockRenderMode}
          showFinishOption
          onLoadProgress={onLoadProgress}
          onLoadComplete={onLoadComplete}
        />
      </View>
    </ImageBackground>
  )
}

/**
 * Demonstrates non-declarative usage of SlidingBlocks via useSlidingBlocks.
 * Composes Root, ScoreBar, GameArea separately. Each has its own Skia Canvas.
 * Host can add custom UI (e.g. header with pause button) and use the imperative ref.
 */
export function ComposableGameScreen({
  onMenuPress
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const settings = useSettings()
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const postLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    SoundPlayer.loadSoundFile('small', 'mp3')
    SoundPlayer.loadSoundFile('big', 'mp3')
  }, [])

  const onLoadProgress = useCallback((p: number) => setProgress(p), [])
  const onLoadComplete = useCallback(() => {
    postLoadTimerRef.current = setTimeout(() => {
      postLoadTimerRef.current = null
      setReady(true)
    }, POST_LOAD_DELAY_MS)
  }, [])

  useEffect(() => {
    const id = scheduleIdle(() => setShowGame(true))
    return () => cancelIdle(id)
  }, [])

  useEffect(
    () => () => {
      if (postLoadTimerRef.current != null) {
        clearTimeout(postLoadTimerRef.current)
        postLoadTimerRef.current = null
      }
    },
    []
  )

  const {
    Root,
    ScoreBar,
    GameArea,
    ref: gameRef
  } = useSlidingBlocks({
    config: settings.gameLayout,
    assets: SLIDING_BLOCKS_ASSETS,
    theme: SLIDING_BLOCKS_THEME,
    callbacks: {
      onFinish: onMenuPress,
      onGameOver: (score) => {
        addScore(score).catch(() => {})
      },
      onRemovingStart: () => {
        try {
          SoundPlayer.playSoundFile('big', 'mp3')
        } catch {
          /* no-op */
        }
      },
      onFitComplete: ({ hadActualFit }) => {
        if (hadActualFit) {
          try {
            SoundPlayer.playSoundFile('small', 'mp3')
          } catch {
            /* no-op */
          }
        }
      }
    },
    settings: {
      block: settings.block,
      explosion: settings.explosion,
      checkerboard: settings.checkerboard,
      explosionPresets: settings.explosionPresets,
      animations: settings.animations,
      feedback: settings.feedback
    },
    blockRenderMode: settings.blockRenderMode,
    showFinishOption: true,
    onLoadProgress,
    onLoadComplete
  })

  return (
    <View style={styles.container}>
      {showGame && (
        <Root>
          {/* Custom header with programmatic pause - demonstrates imperative API */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.menuButtonPressed
              ]}
              onPress={() => onMenuPress()}
            >
              <Text style={styles.menuButtonText}>Menu</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.pauseButton,
                pressed && styles.menuButtonPressed
              ]}
              onPress={() => gameRef.current?.pause()}
            >
              <Text style={styles.menuButtonText}>Pause</Text>
            </Pressable>
          </View>
          {/* Default score bar - own Skia Canvas */}
          <ScoreBar />
          {/* Background + positioned board - host controls layout */}
          <ComposableGameAreaWithLayout
            GameArea={GameArea}
            blockRenderMode={settings.blockRenderMode}
            onLoadProgress={onLoadProgress}
            onLoadComplete={onLoadComplete}
          />
        </Root>
      )}
      {!ready && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
          <PreloaderOverlay
            progress={progress}
            theme={SLIDING_BLOCKS_THEME.loading}
            fillAnimationDurationMs={settings.animations.loadingBarFillMs}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  gameAreaContainer: {
    position: 'absolute'
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 20
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(59,130,246,0.5)',
    borderRadius: 8
  },
  pauseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(168,85,247,0.5)',
    borderRadius: 8
  },
  menuButtonPressed: {
    opacity: 0.8
  },
  menuButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  }
})
