import { useEffect } from 'react'

import { DisposeBag } from '../engine/core/binding'

/**
 * Generic hook for bridging RxJS streams to SharedValues (or any sink).
 * Runs setup once, disposes on unmount.
 */
export function useStreamBridge(
  setup: (disposeBag: DisposeBag) => void,
  deps: React.DependencyList
): void {
  useEffect(() => {
    const bag = new DisposeBag()
    setup(bag)
    return () => bag.dispose()
  }, deps)
}
