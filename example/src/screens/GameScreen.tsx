import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  cancelIdle,
  isSnapshotCompatible,
  PreloaderOverlay,
  scheduleIdle,
  SlidingBlocks
} from 'react-native-sliding-blocks'
import type { GameStateSnapshot } from 'react-native-sliding-blocks'
import SoundPlayer from 'react-native-sound-player'

import { SLIDING_BLOCKS_ASSETS } from '../assets/slidingBlocksAssets'
import {
  clearGameState,
  loadGameState,
  saveGameState
} from '../gameStateStore'
import { useSettings } from '../hooks/useSettings'
import { addScore } from '../scoreStore'
import { POST_LOAD_DELAY_MS, SLIDING_BLOCKS_THEME } from '../theme'

type Props = {
  onMenuPress: () => void
  /** When true, resume from stored state. When false, start new game. */
  shouldResume?: boolean
}

/**
 * Shows a lightweight preloader on first frame, then mounts the heavy SlidingBlocks
 * after the preloader has painted. Host persists game state via AsyncStorage so
 * the game can resume after app kill.
 */
export function GameScreen({ onMenuPress, shouldResume = false }: Props): React.JSX.Element {
  const settings = useSettings()
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [initialState, setInitialState] = useState<
    GameStateSnapshot | undefined | null
  >(null)
  const postLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    SoundPlayer.loadSoundFile('small', 'mp3')
    SoundPlayer.loadSoundFile('big', 'mp3')
  }, [])

  useEffect(() => {
    loadGameState().then((state) => {
      if (
        shouldResume &&
        state &&
        !state.gameOver &&
        isSnapshotCompatible(state, settings.gameLayout)
      ) {
        setInitialState(state)
      } else {
        setInitialState(undefined)
      }
    })
  }, [settings.gameLayout, shouldResume])

  const onLoadProgress = useCallback((p: number) => setProgress(p), [])
  const onLoadComplete = useCallback(() => {
    postLoadTimerRef.current = setTimeout(() => {
      postLoadTimerRef.current = null
      setReady(true)
    }, POST_LOAD_DELAY_MS)
  }, [])

  const onGameStateChange = useCallback((state: GameStateSnapshot) => {
    if (state.gameOver) {
      clearGameState().catch(() => {})
    } else {
      saveGameState(state).catch(() => {})
    }
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

  const canMountGame = showGame && initialState !== null

  return (
    <View style={styles.container}>
      {canMountGame && (
        <SlidingBlocks
          initialState={initialState ?? undefined}
          onGameStateChange={onGameStateChange}
          config={settings.gameLayout}
          assets={SLIDING_BLOCKS_ASSETS}
          theme={SLIDING_BLOCKS_THEME}
          callbacks={{
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
          }}
          settings={{
            block: settings.block,
            explosion: settings.explosion,
            checkerboard: settings.checkerboard,
            explosionPresets: settings.explosionPresets,
            animations: settings.animations,
            feedback: settings.feedback
          }}
          blockRenderMode={settings.blockRenderMode}
          showFinishOption
          onLoadProgress={onLoadProgress}
          onLoadComplete={onLoadComplete}
        />
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
  }
})
