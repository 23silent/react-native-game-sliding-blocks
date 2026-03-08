/**
 * Host score storage. Persists high scores and last game score via AsyncStorage.
 * Host is responsible for calling addScore on game over.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@sliding_blocks_scores'
const MAX_HIGH_SCORES = 10

export type ScoreEntry = {
  score: number
  /** ISO date string when score was recorded */
  date: string
}

export type StoredScores = {
  highScores: ScoreEntry[]
  lastScore: number | null
}

const DEFAULT: StoredScores = {
  highScores: [],
  lastScore: null
}

export async function loadScores(): Promise<StoredScores> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as StoredScores
    return {
      highScores: Array.isArray(parsed.highScores) ? parsed.highScores : [],
      lastScore: typeof parsed.lastScore === 'number' ? parsed.lastScore : null
    }
  } catch {
    return { ...DEFAULT }
  }
}

export async function addScore(score: number): Promise<void> {
  const stored = await loadScores()
  const entry: ScoreEntry = { score, date: new Date().toISOString() }
  const highScores = [...stored.highScores, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HIGH_SCORES)
  const next: StoredScores = { highScores, lastScore: score }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
