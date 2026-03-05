import { Observable, Subscription } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * Fluent API for subscribing to RxJS streams and collecting subscriptions.
 * Use with DisposeBag for cleanup on unmount.
 *
 * @example
 * const bag = new DisposeBag()
 * BinderHook()
 *   .bindAction(score$, v => shared.score.value = v)
 *   .bindAction(items$, v => updateItems(shared, v))
 *   .disposeBy(bag)
 * return () => bag.dispose()
 */
export const BinderHook = (subs: Subscription[] = []) => ({
  bindAction: <T>(value$: Observable<T>, action: (value: T) => void) =>
    BinderHook([...subs, value$.subscribe(action)]),
  disposeBy: (disposeBag: DisposeBag) => disposeBag.addMany(subs)
})

export class DisposeBag {
  private subscriptions: Subscription[] = []

  add(sub: Subscription): void {
    this.subscriptions.push(sub)
  }

  addMany(subs: Subscription[]): void {
    this.subscriptions.push(...subs)
  }

  dispose(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe())
    this.subscriptions = []
  }
}

export const mapToVoid =
  () =>
  <T>(source$: Observable<T>) =>
    source$.pipe(map(() => undefined))
