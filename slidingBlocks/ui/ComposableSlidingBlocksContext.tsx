import React, { createContext, useContext } from 'react'

import type { SharedValuesMap } from '../bridge'
import type { GameConfig } from '../config'
import type { BlockMap } from '../engine'
import type { GameLayout } from './GameCanvas'

export type ComposableSlidingBlocksContextValue = {
  shared: SharedValuesMap
  layout: GameLayout
  config: GameConfig
  block: BlockMap
  hasBlockImages: boolean
  screenWidth: number
  screenHeight: number
}

/**
 * Context for composable SlidingBlocks. Provides layout, shared values, config, and block map.
 * Only available inside useSlidingBlocks Root.
 */
const ComposableSlidingBlocksContext =
  createContext<ComposableSlidingBlocksContextValue | null>(null)

export function ComposableSlidingBlocksProvider({
  value,
  children
}: {
  value: ComposableSlidingBlocksContextValue
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <ComposableSlidingBlocksContext.Provider value={value}>
      {children}
    </ComposableSlidingBlocksContext.Provider>
  )
}

/**
 * Access layout, shared values, config, and block map from the composable SlidingBlocks API.
 * Must be called within useSlidingBlocks Root (e.g. inside a custom GameArea or ScoreBar).
 */
export function useComposableSlidingBlocksContext(): ComposableSlidingBlocksContextValue {
  const ctx = useContext(ComposableSlidingBlocksContext)
  if (!ctx) {
    throw new Error(
      'useComposableSlidingBlocksContext must be used within useSlidingBlocks Root'
    )
  }
  return ctx
}
