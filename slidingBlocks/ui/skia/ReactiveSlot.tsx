import React, { type ReactNode } from 'react'

import type { ReactionRule } from './reactionRules'
import { useReactionRule, useReactionRules } from './useReactionRules'

type ReactiveSlotProps<P> = {
  /** Single rule */
  reaction?: ReactionRule<unknown>
  /** Multiple rules (use instead of reaction) */
  reactions?: ReadonlyArray<ReactionRule<unknown>>
  children: ReactNode
  /** Optional additional props passed through (for typing) */
  _props?: P
}

/**
 * Wrapper that runs reaction rule(s) and renders children.
 * Use when you want a declarative "slot with reaction" pattern.
 *
 * @example
 * <ReactiveSlot reaction={activeGestureSync(slot, translateX)}>
 *   <Image image={image} ... />
 * </ReactiveSlot>
 *
 * @example Multiple rules
 * <ReactiveSlot reactions={[activeGestureSync(slot, tx), fadeWhenInactive(slot)]}>
 *   <Image ... />
 * </ReactiveSlot>
 */
export function ReactiveSlot<P>({
  reaction,
  reactions,
  children
}: ReactiveSlotProps<P>): React.JSX.Element {
  if (reactions && reactions.length > 0) {
    useReactionRules(reactions)
  } else if (reaction) {
    useReactionRule(reaction)
  }
  return <>{children}</>
}
