import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MENU_BG, TEXT_HINT, TEXT_PRIMARY } from '../theme'

export function SplashScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}
    >
      <View style={styles.logoArea}>
        <Text style={styles.title}>Sliding Blocks</Text>
        <Text style={styles.tagline}>Slide blocks to clear rows</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MENU_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  logoArea: {
    alignItems: 'center'
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.5
  },
  tagline: {
    fontSize: 15,
    color: TEXT_HINT,
    marginTop: 10
  }
})
