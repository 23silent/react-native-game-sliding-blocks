import React, { useCallback, useEffect, useRef, useState } from 'react'
import SoundPlayer from 'react-native-sound-player'
import { StyleSheet, View } from 'react-native'

import {
  SlidingBlocks,
  PreloaderOverlay,
  scheduleIdle,
  cancelIdle
} from '../../slidingBlocks'
import { SLIDING_BLOCKS_ASSETS } from '../assets/slidingBlocksAssets'
import { POST_LOAD_DELAY_MS, SLIDING_BLOCKS_THEME } from '../theme'
import { useSettings } from '../hooks/useSettings'

type Props = {
  onMenuPress: () => void
}

/**
 * Shows a lightweight preloader on first frame, then mounts the heavy SlidingBlocks
 * after the preloader has painted. Host provides config (from persisted settings),
 * callbacks, and sounds. No persistence inside SlidingBlocks.
 */
export function GameScreen({ onMenuPress }: Props): React.JSX.Element {
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

  return (
    <View style={styles.container}>
      {showGame && (
        <SlidingBlocks
          config={settings.gameLayout}
          assets={SLIDING_BLOCKS_ASSETS}
          theme={SLIDING_BLOCKS_THEME}
          callbacks={{
            onFinish: onMenuPress,
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
            explosionPresets: settings.explosionPresets
          }}
          blockRenderMode="skia"
          showFinishOption
          onLoadProgress={onLoadProgress}
          onLoadComplete={onLoadComplete}
        />
      )}
      {!ready && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
          <PreloaderOverlay progress={progress} theme={SLIDING_BLOCKS_THEME.loading} />
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
