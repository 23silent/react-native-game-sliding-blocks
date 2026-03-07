import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { LOADING_OVERLAY } from './layoutConsts'
import type { SlidingBlocksTheme } from './SlidingBlocks.types'
import { DEFAULT_SLIDING_BLOCKS_THEME } from './SlidingBlocks.types'

const {
  BOX_WIDTH,
  BOX_HEIGHT,
  BAR_HEIGHT,
  BAR_INSET,
  FILL_ANIMATION_DURATION_MS
} = LOADING_OVERLAY

const TRACK_WIDTH = BOX_WIDTH - BAR_INSET * 2

type Props = {
  progress: number
  /** Optional theme for loading overlay. Host injects from theme config. */
  theme?: Partial<SlidingBlocksTheme['loading']>
}

/**
 * RN-based preloader — renders instantly on first frame (no Skia/Canvas delay).
 * Progress bar animates smoothly so progress changes are clearly visible.
 */
export function PreloaderOverlay({ progress, theme: themeOverrides }: Props): React.JSX.Element {
  const fillWidth = useSharedValue(0)
  const loadingTheme = { ...DEFAULT_SLIDING_BLOCKS_THEME.loading, ...themeOverrides }

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress))
    fillWidth.value = withTiming(clamped * TRACK_WIDTH, {
      duration: FILL_ANIMATION_DURATION_MS
    })
  }, [progress, fillWidth])

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value
  }))

  return (
    <View style={[styles.backdrop, { backgroundColor: loadingTheme.backdrop }]}>
      <View style={[styles.box, { backgroundColor: loadingTheme.box }]}>
        <Text style={[styles.title, { color: loadingTheme.titleColor }]}>Loading...</Text>
        <View style={[styles.barTrack, { backgroundColor: loadingTheme.barTrack }]}>
          <Animated.View style={[styles.barFill, { backgroundColor: loadingTheme.barFill }, fillStyle]} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center'
  },
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: BAR_INSET
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20
  },
  barTrack: {
    width: '100%',
    height: BAR_HEIGHT,
    borderRadius: 4,
    overflow: 'hidden'
  },
  barFill: {
    height: BAR_HEIGHT,
    borderRadius: 4
  }
})
