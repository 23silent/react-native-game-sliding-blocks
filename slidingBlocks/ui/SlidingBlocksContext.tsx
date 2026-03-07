import React, { createContext, useContext } from 'react'

import type { SlidingBlocksContextValue } from './SlidingBlocks.types'

const SlidingBlocksContext = createContext<SlidingBlocksContextValue | null>(
  null
)

export function SlidingBlocksProvider({
  value,
  children
}: {
  value: SlidingBlocksContextValue
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <SlidingBlocksContext.Provider value={value}>
      {children}
    </SlidingBlocksContext.Provider>
  )
}

export function useSlidingBlocksContext(): SlidingBlocksContextValue {
  const ctx = useContext(SlidingBlocksContext)
  if (!ctx) {
    throw new Error('useSlidingBlocksContext must be used within SlidingBlocks')
  }
  return ctx
}

/** Returns settings from context, or null if outside SlidingBlocks. */
export function useSlidingBlocksSettingsOrNull(): SlidingBlocksContextValue['settings'] | null {
  const ctx = useContext(SlidingBlocksContext)
  return ctx?.settings ?? null
}
