# bridge

### Requirement: Single binding point

The bridge SHALL subscribe to all engine RxJS streams in one place and write into SharedValues. There SHALL be no per-component RxJS subscriptions.

#### Scenario: Centralized subscription

- **WHEN** the bridge hook mounts
- **THEN** it subscribes engine streams (score$, multiplier$, items$, etc.) via BinderHook
- **AND** all RxJS → SharedValue writes occur in that single subscription
- **AND** on unmount, all subscriptions are disposed

#### Scenario: No per-component streams

- **WHEN** UI components render
- **THEN** they read SharedValues only
- **AND** no component subscribes directly to engine streams

### Requirement: GestureCompletionOrchestrator

The bridge SHALL coordinate gesture pipeline completion and task pipeline trigger. When the snap animation finishes, it SHALL call `onComplete` to run the task pipeline.

#### Scenario: Snap-to-task handoff

- **WHEN** the snap animation completes (Reanimated `withTiming` finished callback)
- **THEN** the bridge invokes `runGesturePipeline` with `onComplete`
- **AND** the task pipeline runs with the updated items

#### Scenario: Host callbacks at correct times

- **WHEN** rows enter WillRemove state
- **THEN** the bridge calls `onRemovingStart({ hasSuper })` before removal animation
- **AND** when snap animation finishes with `hadActualFit: true`, the bridge calls `onFitComplete({ hadActualFit: true })`

### Requirement: Animation-driven step completion

The bridge SHALL drive step completion via Reanimated animation `finished` callbacks, not timeouts. When the last animation in a batch completes, it SHALL signal `stepComplete$`.

#### Scenario: Step complete on animation finish

- **WHEN** a removal or add animation batch runs
- **THEN** the bridge tracks pending animations
- **AND** when the last `withTiming`/`withSequence` `finished` callback fires, `signalStepComplete()` is called
- **AND** the task pipeline advances

### Requirement: Configurable animation durations and opacities

The bridge SHALL use animation durations and opacity values from settings (`animations`, `feedback`) passed from the host, not hardcoded constants. These include snap, drop, remove fade, game-over overlay, pause overlay, loading bar durations, and block/ghost/indicator opacities.

#### Scenario: Settings-driven animations

- **WHEN** the bridge runs animations (snap, drop, will-remove pulse, remove fade, explosion, overlay fade)
- **THEN** it uses `settings.animations` for durations (completeSnapMs, itemDropMs, willRemovePulseMs, removeFadeMs, removeExplosionMs, gameOverInMs, gameOverOutMs)
- **AND** it uses `settings.feedback` for opacities (blockIdle, willRemovePulseMin, ghostActive, indicatorActive)
- **AND** `pauseOverlayMs` and `loadingBarFillMs` are used by the UI layer (useGameRoot, PreloaderOverlay), not the bridge

#### Scenario: Explosion disabled

- **WHEN** `settings.explosionPresets.explosionEnabled` is `false`
- **THEN** the bridge SHALL NOT trigger explosion pool animations on row clear
- **AND** the block opacity fade animation SHALL still run
