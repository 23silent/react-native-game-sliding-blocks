# ui-components

### Requirement: No React commits during gameplay

The UI SHALL NOT trigger `setState` or `useReducer` from game state updates. React re-renders SHALL occur only on mount and rare layout changes (rotation, keyboard).

#### Scenario: SharedValues for game state

- **WHEN** game state changes (score, items, overlays)
- **THEN** the bridge writes to SharedValues
- **AND** Skia Canvas nodes read SharedValues via `useDerivedValue` or similar
- **AND** no React state is updated from game logic

#### Scenario: Pre-rendered nodes

- **WHEN** the Canvas renders
- **THEN** all Skia nodes (slots, overlay, indicator) are declared upfront
- **AND** visibility and position are controlled by SharedValues (opacity, translateX)
- **AND** no `{condition && <Component />}` driven by game state (score, items, overlays) that would trigger reconciliation during gameplay
- **AND** settings-driven conditionals (e.g. explosion on/off) are acceptable, since settings are stable during active play

### Requirement: Declarative reactions and presets

The UI SHALL support declarative Reanimated reactions via `useReactionRule`/`useReactionRules`. Presets such as `activeGestureSync`, `fadeWhenInactive`, and `syncValue` SHALL work with components implementing slot interfaces (GestureSlot, HasOpacity, HasTranslateX).

#### Scenario: Reaction rules applied

- **WHEN** a component uses `withReaction` or `ReactiveSlot` with a preset
- **THEN** the reaction watches specified SharedValues
- **AND** the `apply` worklet runs when watched values change
- **AND** side effects (e.g., syncing translateX with gesture) occur on the UI thread

### Requirement: Host-provided assets and fallbacks

The UI SHALL accept optional block images and background image from the host. When omitted, it SHALL fall back to Skia-drawn blocks and solid background.

#### Scenario: Skia fallback

- **WHEN** `blockImages` is not provided
- **THEN** blocks are drawn with Skia (colors, shapes)
- **AND** no image assets are required

#### Scenario: Image assets

- **WHEN** `blockImages` is provided
- **THEN** the UI uses the host's PNG assets for blocks
- **AND** background image is used if provided

### Requirement: Configurable settings (animations, feedback, explosion)

The UI SHALL accept `settings` that include `animations` (durations in ms), `feedback` (opacity values), and `explosionPresets`. These are merged with defaults and passed through to the bridge and components. PreloaderOverlay SHALL accept optional `fillAnimationDurationMs` for consistency with `settings.animations.loadingBarFillMs`.

#### Scenario: Explosion and performance

- **WHEN** `settings.explosionPresets.explosionEnabled` is `false`
- **THEN** explosion particles are not rendered or animated
- **AND** the bridge does not trigger explosion pool animations on row clear

- **WHEN** `settings.explosionPresets.circlesOnly` is `true`
- **THEN** explosion particles use circles only (faster rendering)
- **AND** shapes are not mixed (rects, rrects, diamonds)

#### Scenario: Performance presets (host-defined)

- **WHEN** the host defines performance presets (e.g. extra-low, low, fine, good)
- **THEN** presets are applied as `SlidingBlocksSettingsOverrides` (blockRenderMode, explosionPresets, animations)
- **AND** the host is responsible for storing and applying preset overrides
- **AND** the library provides no built-in presets

### Requirement: Game state persistence (host-provided)

The UI SHALL accept `initialState` (GameStateSnapshot) and `onGameStateChange` for host-side persistence. Persistence storage and logic are the host's responsibility.

#### Scenario: Resume from persisted state

- **WHEN** the host passes `initialState` (from storage) to SlidingBlocks or useSlidingBlocks
- **THEN** the game resumes from that state instead of starting fresh
- **AND** `isSnapshotCompatible` is used internally to validate layout before restore

#### Scenario: State change callback

- **WHEN** game state changes (gesture complete, score update, game over)
- **THEN** `onGameStateChange(state)` is called so the host can persist
- **AND** the snapshot includes `gameOver` for the host to decide whether to clear storage

#### Scenario: Imperative getGameState

- **WHEN** the host calls `ref.current?.getGameState()` on the SlidingBlocks handle
- **THEN** it receives the current `GameStateSnapshot` for on-demand persistence (e.g. on pause)
