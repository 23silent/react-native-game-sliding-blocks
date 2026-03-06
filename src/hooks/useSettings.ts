import { useEffect, useState } from 'react'

import { settingsViewModel } from '../settings'
import type { AppSettings } from '../settings/types'

export function useSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(() =>
    settingsViewModel.getSnapshot()
  )

  useEffect(() => {
    const sub = settingsViewModel.settings$.subscribe(setSettings)
    return () => sub.unsubscribe()
  }, [])

  return settings
}
