import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { loadScores, type ScoreEntry } from '../scoreStore'
import {
  CARD_BG,
  HOME_SCREEN,
  MENU_BG,
  TEXT_HINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY
} from '../theme'

type Props = {
  onBack: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

function ScoreRow({
  rank,
  entry
}: {
  rank: number
  entry: ScoreEntry
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>#{rank}</Text>
      <Text style={styles.score}>{entry.score.toLocaleString()}</Text>
      <Text style={styles.date}>{formatDate(entry.date)}</Text>
    </View>
  )
}

export function ScoreBoardScreen({ onBack }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const [scores, setScores] = useState<{
    highScores: ScoreEntry[]
    lastScore: number | null
  } | null>(null)

  const refresh = useCallback(async () => {
    const s = await loadScores()
    setScores(s)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isEmpty =
    scores && scores.highScores.length === 0 && scores.lastScore == null

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        onPress={onBack}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Score Board</Text>

      {scores == null ? (
        <ActivityIndicator style={styles.loader} color={TEXT_SECONDARY} />
      ) : isEmpty ? (
        <View style={styles.emptyCard}>
          <Text style={styles.placeholder}>No scores yet.</Text>
          <Text style={styles.placeholderHint}>Play a game to get started!</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {scores.lastScore != null && (
            <View style={styles.lastGameSection}>
              <Text style={styles.sectionTitle}>Last Game</Text>
              <View style={styles.lastScoreCard}>
                <Text style={styles.lastScore}>
                  {scores.lastScore.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
          {scores.highScores.length > 0 && (
            <View style={styles.highScoresSection}>
              <Text style={styles.sectionTitle}>High Scores</Text>
              <View style={styles.highScoresCard}>
                <FlatList
                data={scores.highScores}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item, index }) => (
                  <ScoreRow rank={index + 1} entry={item} />
                )}
                scrollEnabled={false}
              />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MENU_BG,
    paddingHorizontal: 24
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 24
  },
  pressed: {
    opacity: 0.7
  },
  backText: {
    fontSize: 16,
    color: TEXT_SECONDARY
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 16
  },
  placeholder: {
    fontSize: 16,
    color: TEXT_MUTED
  },
  placeholderHint: {
    fontSize: 14,
    color: TEXT_HINT,
    marginTop: 4
  },
  emptyCard: {
    backgroundColor: CARD_BG,
    borderRadius: HOME_SCREEN.CARD_BORDER_RADIUS,
    padding: 24,
    alignItems: 'center'
  },
  lastScoreCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  highScoresCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    overflow: 'hidden'
  },
  loader: {
    marginTop: 24
  },
  content: {
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  lastGameSection: {
    marginBottom: 24
  },
  lastScore: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY
  },
  highScoresSection: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,90,43,0.25)'
  },
  rank: {
    width: 36,
    fontSize: 14,
    color: TEXT_MUTED
  },
  score: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY
  },
  date: {
    fontSize: 13,
    color: TEXT_MUTED
  }
})
