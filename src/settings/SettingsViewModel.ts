import AsyncStorage from '@react-native-async-storage/async-storage'
import { BehaviorSubject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

import { DEFAULT_SETTINGS } from './defaults'
import type { AppSettings, AppSettingsOverrides } from './types'

const STORAGE_KEY = '@slidingblocks/settings'

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key of Object.keys(source) as (keyof T)[]) {
    const val = source[key]
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      ;(result as Record<string, unknown>)[key as string] = deepMerge(
        (target[key] as object) || {},
        val as object
      )
    } else if (val !== undefined) {
      ;(result as Record<string, unknown>)[key as string] = val
    }
  }
  return result
}

export class SettingsViewModel {
  private readonly subject$ = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS)
  private initialized = false

  readonly settings$ = this.subject$.pipe(
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  )

  private async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>
        const merged = deepMerge(DEFAULT_SETTINGS, parsed)
        this.subject$.next(merged)
      }
    } catch {
      // Use defaults on parse/storage error
    }
    this.initialized = true
  }

  private async persist(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore persistence errors
    }
  }

  /** Initialize and load persisted settings. Call once at app start. */
  async init(): Promise<void> {
    if (this.initialized) return
    await this.load()
  }

  getSnapshot(): AppSettings {
    return this.subject$.getValue()
  }

  update(overrides: AppSettingsOverrides): void {
    const current = this.subject$.getValue()
    const merged = deepMerge(current, overrides as Partial<AppSettings>)
    this.subject$.next(merged)
    this.persist(merged)
  }

  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
    this.subject$.next(DEFAULT_SETTINGS)
  }
}

export const settingsViewModel = new SettingsViewModel()
