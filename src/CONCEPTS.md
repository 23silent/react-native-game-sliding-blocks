# Core Concepts (Reusable Across Games)

Patterns for building high-performance React Native games with this library. Goal: **smooth 60fps, no React commits during gameplay, pre-rendered UI**.

This doc is for **contributors** and for building new games that reuse these patterns (e.g. by extending or forking the library). The binding/pipeline utilities are internal modules, not exported from the package.

---

## Architecture

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Engine** | `engine/` | Pure game logic, RxJS, no React or Reanimated |
| **Bridge** | `bridge/` | RxJS → SharedValues binding; the only layer that knows RxJS and Reanimated |
| **UI** | `ui/` | React components, Skia, SharedValues only (no RxJS) |

Dependency flow: `engine ← bridge ← ui`. The UI imports engine types and bridge hooks.

---

## Host Responsibilities

SlidingBlocks has **no bundled assets** and **no platform dependencies**. The host provides everything:

| Concern | Host provides | Fallback when omitted |
|---------|---------------|------------------------|
| **Block images** | `assets.blockImages` (color → [1x1, 1x2, 1x3, 1x4]) | Skia-drawn blocks |
| **Background** | `assets.backgroundImage` | Solid color |
| **Sounds** | Via callbacks: `onRemovingStart` (row clear), `onFitComplete` with `{ hadActualFit }` (slide) | No sound |
| **Persistence** | `onScoreChange`, `onGameOver`, `onGameStateChange`, `initialState` | None |
| **Animation/feedback tuning** | `settings.animations` (durations in ms), `settings.feedback` (opacity values) | SDK defaults |
| **Performance tuning** | `settings.explosionPresets` (explosionEnabled, circlesOnly, particleCount), `blockRenderMode`, `settings.animations` | Explosion on, mixed shapes, default durations |

Sound and other side effects are never invoked by the engine. The bridge calls `onRemovingStart` when rows enter removal, and `onFitComplete({ hadActualFit })` when the snap animation finishes—only `hadActualFit: true` when blocks actually moved.

**Animation durations** (snap, drop, remove fade, game-over overlay, pause overlay, loading bar) and **feedback opacities** (block idle, ghost, indicator, will-remove pulse) are configurable via `settings.animations` and `settings.feedback`. The bridge and engine use these values instead of hardcoded constants. For a pre-created engine, pass `animOverrides` to `createGameEngine` so step-complete timeouts match the UI animations.

**Performance tuning** — The host can reduce load on low-end devices via settings: `explosionPresets.explosionEnabled: false` disables explosion particles; `explosionPresets.circlesOnly: true` uses circles-only particles (faster than mixed shapes); setting `animations.*` durations to 0 disables animations; `blockRenderMode: 'image'` or `'skia'` selects block rendering. **Performance presets** (e.g. extra-low, low, fine, good) are host-defined: create overrides and apply via the host's settings store. The example app shows this in `example/src/settings/performancePresets.ts`.

**Game state persistence** — The engine exposes `getGameState()` returning a `GameStateSnapshot` (rows, score, multiplier, layoutVersion, gameOver). The host persists this (e.g. AsyncStorage) and passes it back as `initialState` to resume after app kill. The engine calls `onGameStateChange(state)` when state changes so the host can persist. Use `isSnapshotCompatible(snapshot, config)` before resuming to ensure the saved state matches the current layout.

---

## 1. No React Commits During Gameplay

**Idea:** Game state never triggers `setState` or `useReducer`. React re-renders only on mount and rare layout changes (rotation, keyboard).

**How:**
- Hold game state in **RxJS streams** (ViewModels)
- Hold UI state in **Reanimated SharedValues**
- A single **bridge** subscribes to RxJS and writes into SharedValues
- Views read SharedValues only → no React state updates from game logic

**Reuse:** Keep ViewModels pure (RxJS). Use `useStreamBridge` to connect them to SharedValues. Never call `setState` from game logic.

---

## 2. Pre-rendered UI

**Idea:** All Skia (or native) nodes exist from the start. Nothing is conditionally mounted from game state.

**How:**
- Declare all Canvas nodes upfront (e.g. 48 item slots, overlay, indicator)
- Use SharedValues for opacity, position, visibility
- No `{condition && <Component />}` that would trigger reconciliation
- Nodes are always in the tree; SharedValues control what's visible

**Reuse:** Design your Canvas with fixed slots. Use `opacity: 0` or off-screen position for "hidden" elements.

---

## 3. Single Binding Point

**Idea:** One place subscribes all engine streams → SharedValues. No per-component subscriptions.

**How:**
- One hook (e.g. `useEngineBridge`) that receives engine + shared map
- Uses `BinderHook` + `DisposeBag` to subscribe and cleanup
- All RxJS → SharedValue writes happen there

**Reuse:** `BinderHook` and `DisposeBag` from `engine/core/binding`; `useStreamBridge` from `bridge/`. Your game's bridge hook (e.g. `useEngineBridge`) calls them with game-specific mappings.

---

## 4. React-Agnostic Engine

**Idea:** The engine (and ViewModels) have no React or Reanimated imports. Testable without a renderer, reusable from non-React code.

**How:**
- Engine = composition of ViewModels, exposes RxJS streams + methods
- ViewModels use RxJS only
- React is only at the edge: components + bridge hook

**Reuse:** Put game logic in plain TS classes. Keep React in components and the bridge.

---

## 5. MVVM Layering

| Layer | Responsibility | Dependencies |
|-------|----------------|--------------|
| **Model** | Domain logic, types, pure functions | None |
| **ViewModels** | Presentation logic, RxJS streams | Model |
| **Engine** | Facade composing ViewModels | ViewModels |
| **Binding** | RxJS → SharedValues (bridge hook) | Engine, Reanimated |
| **View** | React components, Skia Canvas | Binding, SharedValues |

---

## Recipe for a New Game

1. **Model** — Types, game rules, process loop (fit/remove/add or equivalent)
2. **ViewModels** — RxJS streams for state; GestureCoordinator for input
3. **Engine** — Facade that composes ViewModels, exposes streams + methods
4. **useSharedValuesMap** — Hook (in `bridge/`) that creates all SharedValues (score, items, overlays, etc.)
5. **Bridge** — Hook that uses `BinderHook` to subscribe engine streams → SharedValues
6. **Canvas** — Pre-rendered Skia nodes, all driven by SharedValues
7. **GestureView** — Gesture handling with `scheduleOnRN` to call engine methods (no object capture in worklets)

Use `engine/core/binding` for BinderHook and DisposeBag; `bridge/useStreamBridge` for the subscription helper. Keep game-specific logic in your game module.

---

## 6. Declarative Reactions (Skia/Reanimated)

**Idea:** Define Reanimated reactions (watch SharedValues → apply side effects) in a declarative, reusable way.

**How:**
- `useReactionRule(rule)` / `useReactionRules(rules)` — run one or more `{ watch, apply }` rules
- **Components:** `ReactiveSlot` wraps children with a reaction; `withReaction` is the HOC variant
- **Presets:** `activeGestureSync` (sync translateX with gesture), `fadeWhenInactive` (dim inactive slots), `syncValue` (copy one SharedValue to another)
- **Slot interfaces** (`GestureSlot`, `HasOpacity`, `HasTranslateX`, etc. in `ui/skia/types`) — presets expect these so they work with any component that implements them

**Reuse:** Use presets or define custom rules. Rule functions must be worklets (`'worklet'` as first statement).

---

## 7. Pipeline Architecture (Gesture & Task)

**Idea:** Two main pipelines drive the game flow. Each uses `createPipeline` from `engine/core/pipeline`. Side effects (sound, analytics) are the **host's responsibility** via callbacks—the engine never invokes them.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GESTURE PIPELINE (triggered on pan end)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User releases finger                                                      │
│         │                                                                   │
│         ▼                                                                   │
│   GestureCoordinator.endValues$  ──►  filter, map  ──►  onCompleteEnd$      │
│         │                                    │                              │
│         │                                    ▼                              │
│         │                          Bridge: snap animation (Reanimated)      │
│         │                                    │                              │
│         │                                    │  onSnapAnimationComplete     │
│         │                                    ▼                              │
│         │                          GestureCompletionOrchestrator            │
│         │                                    │                              │
│         │                          runGesturePipeline: onComplete           │
│         │                                    │                              │
│         │                                    ▼                              │
│         │                          Bridge calls onFitComplete({ hadActualFit }) │
│         │                                    │                              │
└─────────┼──────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TASK PIPELINE (triggered by onComplete)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   engine.onGestureComplete(updated)  ◄──── onComplete(ctx.updated)           │
│         │                                                                   │
│         ├── game.onCompleteGesture(updated)                                 │
│         │         │                                                         │
│         │         ├── applyGestureResultSync (items$)                       │
│         │         ├── processData.setSegments + doProcess                   │
│         │         │         │                                               │
│         │         │         ▼                                               │
│         │         │   stopProcessing ──► prepareTasks ──► for each task:    │
│         │         │                            │                            │
│         │         │                            │  runTaskApplyPipeline:     │
│         │         │                            │    updateScore             │
│         │         │                            │    applyState              │
│         │         │                            │    waitForAnimation        │
│         │         │                                                         │
│         │         │   Bridge calls onRemovingStart({ hasSuper }) when rows  │
│         │         │   enter WillRemove (host plays sound, etc.)             │
│         │         │                                                         │
│         └── gesture.onAnimationFinish (clear active, reset translateX)      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Summary

| Pipeline | Trigger | Where | Middlewares |
|----------|---------|-------|-------------|
| **Gesture** | Snap animation finished | GestureCompletionOrchestrator | onComplete |
| **Task** | onComplete (after gesture) | GameViewModel.applyTask | updateScore, applyState, waitForAnimation |

Side effects (sound, analytics) are invoked by the **bridge** via callbacks (`onRemovingStart`, `onFitComplete`). The engine and pipelines have no knowledge of them.

### Entry Point

The view calls a single method: `engine.onGestureComplete(updated)`. The engine applies the gesture, starts the task pipeline, and clears gesture state.

### Reuse

`createPipeline` lives in `engine/core/pipeline` (internal; not exported from the package). When extending this library:

```ts
import { createPipeline } from '../engine/core/pipeline'

const myPipeline = createPipeline<MyContext>([
  (ctx, next) => { /* side effect */ return next() },
  (ctx, next) => { /* core logic */ return next() }
])
myPipeline(context)
```

---

## 8. Animation-Driven Flow (No Magic Timeouts)

**Idea:** All timing is driven by gesture completion or animation completion. No `setTimeout` for game logic.

**How:**

- **Gesture pipeline** — Snap animation uses `withTiming(..., finished => onSnapAnimationComplete)`.
- **Step complete** — Bridge counts pending animations per batch; when the last `withTiming`/`withSequence` `finished` callback fires, it calls `signalStepComplete()`.
- **Overlay fade-out** — When restarting from game over, score reset waits for `overlayFadeOutComplete$`, which the bridge emits from `withTiming(0, ..., finished => signalOverlayFadeOutComplete)`.
- **Task pipeline** — Waits for `stepComplete$` (animation-driven). A 3× timer is kept only as a safety fallback.
- **Configurable durations** — All animation durations (snap, drop, remove, overlay, etc.) and feedback opacities (block, ghost, indicator) come from `settings.animations` and `settings.feedback`, merged with defaults. The bridge receives these from the root and passes them to helpers.

**Reuse:** Use Reanimated `finished` callbacks and `scheduleOnRN` for JS-side logic. Avoid timeouts for sequencing.

---

## 9. Game State Persistence (Host Responsibility)

**Idea:** The engine exposes serializable state. The host persists it and restores on next launch. Persistence storage and logic live in the host app.

**How:**
- `IGameEngine.getGameState()` returns `GameStateSnapshot` (rows, score, multiplier, layoutVersion, gameOver)
- `createGameEngine(..., { initialState, onGameStateChange })` — pass `initialState` to restore; `onGameStateChange` is invoked when state changes
- `SlidingBlocks` accepts `initialState` and `onGameStateChange` props
- `isSnapshotCompatible(snapshot, config)` validates layout before resume (rowsCount, columnsCount, keysSize must match)

**Reuse:** Host loads state on mount, validates with `isSnapshotCompatible`, passes to engine/SlidingBlocks. Host persists on `onGameStateChange`; typically clears storage when `gameOver: true`.
