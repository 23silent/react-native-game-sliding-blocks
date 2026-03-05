import { useAnimatedReaction } from 'react-native-reanimated'

import type { ReactionRule } from './reactionRules'

/**
 * Runs a single reaction rule. For multiple rules, call multiple times
 * (each useAnimatedReaction is independent).
 *
 * Rule functions must be worklets (add 'worklet' as first statement) since they run on the UI thread.
 * Presets in presets.ts already include the directive.
 *
 * @example
 * useReactionRule({
 *   watch: () => ({ tx: translateX.value, isActive: slot.isActive.value }),
 *   apply: ({ tx, isActive }) => {
 *     if (isActive && tx !== undefined) {
 *       slot.translateX.value = slot.initialLeft.value + tx
 *     }
 *   }
 * })
 */
export function useReactionRule<T>(rule: ReactionRule<T>): void {
  useAnimatedReaction(rule.watch, rule.apply)
}

/**
 * Runs multiple reaction rules in one useAnimatedReaction.
 * Use when you have several independent watch/apply pairs.
 */
export function useReactionRules<T>(rules: ReadonlyArray<ReactionRule<T>>): void {
  useAnimatedReaction(
    () => rules.map(r => r.watch()),
    values => {
      for (let i = 0; i < rules.length; i++) {
        rules[i].apply(values[i] as T)
      }
    }
  )
}
