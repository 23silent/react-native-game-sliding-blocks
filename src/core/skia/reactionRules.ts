/**
 * Declarative reaction rules for Reanimated.
 * Use with useReactionRules to run multiple watch/apply pairs in a single worklet.
 */

export type ReactionRule<T = unknown> = {
  watch: () => T
  apply: (value: T) => void
}
