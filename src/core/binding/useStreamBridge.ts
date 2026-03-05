import { useEffect } from 'react'

import { DisposeBag } from './BinderHook'

/**
 * Generic hook for bridging RxJS streams to SharedValues (or any sink).
 * Runs setup once, disposes on unmount.
 *
 * @param setup - Function that receives a DisposeBag, subscribes streams, calls disposeBy(bag)
 * @param deps - Effect dependencies (e.g. [engine])
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
