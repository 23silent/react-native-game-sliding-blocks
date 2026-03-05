import type { ComponentType } from 'react'
import React from 'react'

import type { ReactionRule } from './reactionRules'
import { useReactionRule, useReactionRules } from './useReactionRules'

/**
 * HOC that adds declarative reaction rule(s) to a component.
 * Rules run when the component mounts and dispose on unmount.
 *
 * @example Single rule
 * const ItemWithGestureSync = withReaction(Item, (props) =>
 *   activeGestureSync(props.slot, props.translateX)
 * )
 *
 * @example Multiple rules
 * const ItemWithEffects = withReaction(Item, (props) => [
 *   activeGestureSync(props.slot, props.translateX),
 *   fadeWhenInactive(props.slot)
 * ])
 */
export function withReaction<P extends object>(
  Wrapped: ComponentType<P>,
  getRuleOrRules:
    | ((props: P) => ReactionRule<unknown>)
    | ((props: P) => ReadonlyArray<ReactionRule<unknown>>)
): ComponentType<P> {
  function WithReaction(props: P) {
    const ruleOrRules = getRuleOrRules(props)
    if (Array.isArray(ruleOrRules) && ruleOrRules.length > 0) {
      useReactionRules(ruleOrRules)
    } else {
      useReactionRule(ruleOrRules as ReactionRule<unknown>)
    }
    return React.createElement(Wrapped, props)
  }
  WithReaction.displayName = `WithReaction(${
    Wrapped.displayName ?? Wrapped.name ?? 'Component'
  })`
  return WithReaction
}
