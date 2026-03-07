import type { SlidingBlocksTheme } from '../SlidingBlocks.types'

/** No-op function for optional callbacks. */
export const noop = (): void => {}

/** Merges theme overrides into base theme. Returns base if no overrides. */
export function mergeTheme(
  base: SlidingBlocksTheme,
  overrides?: Partial<SlidingBlocksTheme>
): SlidingBlocksTheme {
  if (!overrides) return base
  return {
    block: { ...base.block, ...overrides.block },
    overlay: { ...base.overlay, ...overrides.overlay },
    loading: { ...base.loading, ...overrides.loading },
    scoreBar: { ...base.scoreBar, ...overrides.scoreBar }
  }
}
