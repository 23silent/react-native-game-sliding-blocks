import React, { useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isSnapshotCompatible } from 'react-native-sliding-blocks'

import { loadGameState } from '../gameStateStore'
import { useSettings } from '../hooks/useSettings'
import type { Route } from '../navigation/types'
import {
  BUTTON_PRIMARY,
  BUTTON_PRIMARY_TEXT,
  BUTTON_SECONDARY,
  CARD_BG,
  HOME_SCREEN,
  MENU_BG,
  TEXT_HINT,
  TEXT_PRIMARY,
  TEXT_SECONDARY
} from '../theme'

type Props = {
  onNavigate: (route: Route) => void
}

export function HomeScreen({ onNavigate }: Props): React.JSX.Element {
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const settings = useSettings()
  const [hasStoredState, setHasStoredState] = useState(false)

  useEffect(() => {
    loadGameState().then(state => {
      setHasStoredState(
        !!(
          state &&
          !state.gameOver &&
          isSnapshotCompatible(state, settings.gameLayout)
        )
      )
    })
  }, [settings.gameLayout])

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Sliding Blocks</Text>
          <Text style={styles.tagline}>Slide blocks to clear rows</Text>
        </View>

        <View style={[styles.card, { marginTop: height * 0.06 }]}>
          <Text style={styles.cardLabel}>Play</Text>
          <View style={styles.buttons}>
            {hasStoredState && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonPrimary,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => onNavigate('game-resume')}
              >
                <Text style={[styles.buttonText, styles.buttonPrimaryText]}>
                  Resume
                </Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                hasStoredState ? styles.buttonSecondary : styles.buttonPrimary,
                pressed && styles.buttonPressed
              ]}
              onPress={() => onNavigate('game')}
            >
              <Text
                style={[
                  styles.buttonText,
                  hasStoredState ? undefined : styles.buttonPrimaryText
                ]}
              >
                {hasStoredState ? 'New Game' : 'Start Game'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Scores & Settings</Text>
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                pressed && styles.buttonPressed
              ]}
              onPress={() => onNavigate('scoreboard')}
            >
              <Text style={styles.buttonText}>Score Board</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                pressed && styles.buttonPressed
              ]}
              onPress={() => onNavigate('settings')}
            >
              <Text style={styles.buttonText}>Settings</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.composableLink,
            pressed && styles.buttonPressed
          ]}
          onPress={() => onNavigate('composable-game')}
        >
          <Text style={styles.composableText}>Composable demo →</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MENU_BG,
    alignItems: 'center',
    paddingHorizontal: 24
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24
  },
  header: {
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
    marginTop: 8
  },
  card: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: CARD_BG,
    borderRadius: HOME_SCREEN.CARD_BORDER_RADIUS,
    padding: HOME_SCREEN.CARD_PADDING,
    marginBottom: 16
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_HINT,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12
  },
  buttons: {
    alignItems: 'center',
    gap: HOME_SCREEN.BUTTON_GAP
  },
  button: {
    width: '100%',
    height: HOME_SCREEN.BUTTON_HEIGHT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPrimary: {
    backgroundColor: BUTTON_PRIMARY
  },
  buttonSecondary: {
    backgroundColor: BUTTON_SECONDARY
  },
  buttonPressed: {
    opacity: 0.88
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_SECONDARY
  },
  buttonPrimaryText: {
    color: BUTTON_PRIMARY_TEXT
  },
  composableLink: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  composableText: {
    fontSize: 14,
    color: TEXT_HINT
  }
})
