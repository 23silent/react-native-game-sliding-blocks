import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MENU_BG, TEXT_PRIMARY } from '../theme'

export function SplashScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}
    >
      <Text style={styles.title}>Sliding Blocks</Text>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center'
  }
})
