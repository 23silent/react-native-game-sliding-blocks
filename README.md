# react-native-sliding-blocks

A **React Native game library** for building high-performance sliding block puzzles. Slide colored segments on a grid, fill rows to clear them, and watch blocks cascade. Built with Skia, Reanimated, and RxJS—60fps on iOS and Android.

**This is a library package**, not a standalone app. Install it in your React Native project and integrate the game with your own UI, assets, and logic.

---

## Installation

```bash
npm install react-native-sliding-blocks
# or
yarn add react-native-sliding-blocks
```

### Peer Dependencies

Install these in your app (they are **peer dependencies**):

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `react-native` | Mobile runtime |
| `@shopify/react-native-skia` | 2D graphics & canvas |
| `react-native-reanimated` | Animations |
| `react-native-gesture-handler` | Touch and gestures |
| `react-native-worklets` | UI thread worklets |
| `rxjs` | Reactive streams |

**Requirements:** Node.js ≥ 22.11.0

---

## Quick Start

```tsx
import { SlidingBlocks } from 'react-native-sliding-blocks'

function GameScreen() {
  return (
    <SlidingBlocks
      config={{
        rowsCount: 10,
        columnsCount: 8,
        padding: 16,
        explosionPoolSize: 80,
        keysSize: 5
      }}
      callbacks={{
        onScoreChange: (score) => console.log('Score:', score),
        onGameOver: (score) => console.log('Game over:', score),
        onRemovingStart: () => playClearSound(),
        onFitComplete: ({ hadActualFit }) => hadActualFit && playSlideSound()
      }}
    />
  )
}
```

The library uses **Skia-drawn blocks** and a solid background by default. No assets required.

---

## API

### Declarative API — `<SlidingBlocks />`

All-in-one component. Pass config, callbacks, and optional assets/theme.

```tsx
<SlidingBlocks
  config={SlidingBlocksConfig}
  callbacks?: SlidingBlocksCallbacks
  assets?: SlidingBlocksAssets
  theme?: Partial<SlidingBlocksTheme>
  settings?: SlidingBlocksSettingsOverrides
  engine?: IGameEngine
  initialState?: GameStateSnapshot | null
  onGameStateChange?: (state: GameStateSnapshot) => void
  blockRenderMode?: 'skia' | 'image'
  showFinishOption?: boolean
  onLoadProgress?: (progress: number) => void
  onLoadComplete?: () => void
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `config` | `SlidingBlocksConfig` | **Required.** Grid layout: `rowsCount`, `columnsCount`, `padding`, `explosionPoolSize`, `keysSize` |
| `callbacks` | `SlidingBlocksCallbacks` | Score, game over, pause, restart, sound hooks, etc. |
| `assets` | `SlidingBlocksAssets` | Block PNGs, background image. Omit for Skia fallbacks |
| `theme` | `Partial<SlidingBlocksTheme>` | Overlay, score bar, block colors |
| `settings` | `SlidingBlocksSettingsOverrides` | Block, explosion, checkerboard, explosionPresets, **animations** (durations in ms), **feedback** (opacity values). Use `explosionPresets.performanceMode: 'low'` for smoother explosions on low-end Android. |
| `engine` | `IGameEngine` | Optional pre-created engine |
| `initialState` | `GameStateSnapshot \| null` | Restore from persisted state; host loads from storage to resume after app kill |
| `onGameStateChange` | `(state: GameStateSnapshot) => void` | Called when state changes; host should persist (e.g. AsyncStorage). Snapshot includes `gameOver` flag; host typically clears when game over. |
| `blockRenderMode` | `'skia' \| 'image'` | `'skia'` = draw blocks (default), `'image'` = PNG assets |
| `showFinishOption` | `boolean` | Show "Finish" in pause overlay; use with `onFinish` |

#### Imperative handle (ref)

```tsx
const ref = useRef<SlidingBlocksHandle>(null)

<SlidingBlocks ref={ref} config={...} callbacks={...} />

// Then:
ref.current?.pause()
ref.current?.resume()
ref.current?.restart()
ref.current?.isPaused()  // boolean
ref.current?.getGameState()  // GameStateSnapshot for persistence
```

---

### Composable API — `useSlidingBlocks`

Build custom layouts (e.g. custom score bar, different ordering).

```tsx
import { useSlidingBlocks } from 'react-native-sliding-blocks'

function CustomGameScreen() {
  const { Root, ScoreBar, GameArea, ref } = useSlidingBlocks({
    config: { rowsCount: 10, columnsCount: 8, padding: 16, explosionPoolSize: 80, keysSize: 5 },
    callbacks: { onScoreChange, onGameOver }
  })

  return (
    <Root>
      <MyCustomScoreBar />
      <GameArea blockRenderMode="skia" onLoadComplete={() => setReady(true)} />
    </Root>
  )
}
```

Returns:

- `Root` — Wrapper; must wrap `ScoreBar` and `GameArea`
- `ScoreBar` — Default score bar
- `GameArea` — Game canvas (blocks, grid, overlays)
- `ref` — `SlidingBlocksHandle` (pause, resume, restart, isPaused, getGameState)

For fully custom layouts, use `useComposableSlidingBlocksContext()` inside `Root` to access layout and shared values.

---

### Low-level API

- **`GameRootView`** — Minimal wrapper when you need full control over layout and bridge.
- **`createGameEngine(config, host?, options?)`** — Create a React-agnostic engine for headless testing or custom integration. `options` can include `onRowAdded`, `animOverrides` (`removeFadeMs`, `itemDropMs`), `initialState` (restore from persisted state), and `onGameStateChange` (called when state changes for host persistence).
- **`GameStateSnapshot`**, **`isSnapshotCompatible(snapshot, config)`**, **`getLayoutVersion(config)`** — Types and helpers for game state persistence. Use `isSnapshotCompatible` before resuming to ensure saved state matches current layout.
- **`PreloaderOverlay`** — Loading overlay; optional `fillAnimationDurationMs` prop. Use `settings.animations.loadingBarFillMs` for consistency.
- **`scheduleIdle`**, **`cancelIdle`**, **`GESTURE_SENSITIVITY`**, **layout constants** (TOP_PAUSE, SCORE_BAR, etc.) — Exported for advanced use.

---

## Game State Persistence

The library provides **serializable game state** for host-side persistence. Persistence (e.g. AsyncStorage) is the **host's responsibility**.

| Export | Purpose |
|--------|---------|
| `GameStateSnapshot` | Serializable type: `rows`, `score`, `multiplier`, `layoutVersion`, `gameOver` |
| `getGameState()` | Engine / handle method — returns current state |
| `initialState` prop | Pass loaded state to resume after app kill |
| `onGameStateChange` | Callback — persist when state changes; host typically clears when `gameOver: true` |
| `isSnapshotCompatible(snapshot, config)` | Validate saved state matches current layout before resume |

**Example flow:**
1. On mount: load from storage → if valid and not game over → pass as `initialState`.
2. On state change: `onGameStateChange(state)` → persist to storage.
3. On game over: clear stored state (host decides).
4. Use `isSnapshotCompatible` so layout changes (e.g. settings) don't corrupt restore.

---

## Configuration

### SlidingBlocksConfig (game layout)

```ts
type SlidingBlocksConfig = {
  rowsCount: number      // e.g. 10
  columnsCount: number   // e.g. 8
  padding: number        // screen padding (px)
  explosionPoolSize: number
  keysSize: number       // block types (colors)
}
```

### SlidingBlocksCallbacks

| Callback | When |
|----------|------|
| `onScoreChange` | After each row clear |
| `onGameOver` | Game ends |
| `onPause` / `onResume` | User pauses/resumes |
| `onRestart` | User restarts (from overlay) |
| `onFinish` | User taps "Finish" in pause overlay |
| `onGestureStart` / `onGestureEnd` | Pan starts/ends |
| `onRemovingStart` / `onRemovingEnd` | Row clear animation starts/ends; payload `{ hasSuper: boolean }` |
| `onFitStart` / `onFitComplete` | Slide/snap animation; `onFitComplete({ hadActualFit })` for slide sound (hadActualFit = true when blocks actually moved) |
| `onRowAdded` | New row added at top |

### SlidingBlocksAssets

| Asset | Description |
|-------|-------------|
| `blockImages` | Map of color hex → `[1×1, 1×2, 1×3, 1×4]` image sources (e.g. `require(...)`) |
| `backgroundImage` | Full-screen background image source |

Omit for fallbacks: solid background, Skia-drawn blocks.

### SlidingBlocksSettingsOverrides

Partial overrides merged with defaults. All optional.

| Category | Fields | Description |
|----------|--------|-------------|
| `block` | `radius`, `borderWidth`, `borderColor`, `frostHighlightColor`, `frostHighlightHeightRatio`, `superGradientColors`, `superGradientSteps` | Block appearance |
| `explosion` | `radius`, `baseParticleSize`, `riseHeight`, `fallDistance`, `pictureSize` | Explosion particles |
| `checkerboard` | `defaultBaseColor`, `defaultDarkOpacity`, `defaultLightOpacity` | Grid styling |
| `explosionPresets` | `particleCount`, `trajectoryPresetCount`, `shapePresetCount`, `performanceMode` | Explosion variety; `performanceMode: 'low'` for low-end devices |
| **`animations`** | `completeSnapMs`, `itemDropMs`, `willRemovePulseMs`, `removeFadeMs`, `removeExplosionMs`, `gameOverInMs`, `gameOverOutMs`, `pauseOverlayMs`, `loadingBarFillMs` | Animation durations (ms). `removeFadeMs` = block opacity fade; `removeExplosionMs` = explosion particles. |
| **`feedback`** | `blockIdle`, `willRemovePulseMin`, `ghostActive`, `indicatorActive` | Opacity values (0–1) for blocks, ghost, indicator |

---

## Game Mechanics

- **Grid** — Configurable columns × rows (e.g. 8×10)
- **Blocks** — Colored segments (1–4 cells). Drag left/right to reposition.
- **Clearing** — Fill a row completely to clear it; blocks above drop.
- **Super segments** — Rare black segments; when cleared, also wipe overlapping blocks in adjacent rows for combos.
- **Score & multiplier** — Animated display.

---

## Architecture

The package uses **MVVM** with RxJS and Reanimated. The engine is React-agnostic; a bridge wires RxJS streams to SharedValues. No React commits during gameplay—all rendering is driven by SharedValues and Skia.

For a deep dive, see [src/CONCEPTS.md](src/CONCEPTS.md).

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Engine** | `engine/` | Pure game logic, RxJS, no React |
| **Bridge** | `bridge/` | RxJS → SharedValues binding |
| **UI** | `ui/` | React components, Skia, SharedValues |

---

## Project Structure

```
react-native-sliding-blocks/
├── src/                # Library source
│   ├── bridge/         # RxJS → SharedValues (useEngineBridge, GestureCompletionOrchestrator)
│   ├── engine/         # Game logic, RxJS, no React
│   ├── ui/             # React components, Skia, contexts
│   ├── constants/      # Layout constants, game config
│   ├── types/          # Settings, layout types
│   ├── config.ts
│   ├── CONCEPTS.md     # Architecture guide
│   └── index.ts
├── example/            # Example React Native app
└── package.json
```

---

## Example App

An example app lives in `example/`—it shows the declarative and composable APIs, settings, sounds, themes, and **game state persistence** (AsyncStorage) with a Resume button when stored state exists.

```bash
# From repo root
yarn install
yarn example              # Install example deps
yarn example:start        # Start Metro
yarn example:ios          # Run iOS (in another terminal)
yarn example:android      # Run Android (in another terminal)
```

**Developing the library?** The example uses Metro's custom resolver so changes in `src/` trigger hot reload. See [DEVELOPMENT.md](DEVELOPMENT.md).

Requires [React Native environment setup](https://reactnative.dev/docs/environment-setup).

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn lint` | Lint library source |
| `yarn example` | Install example dependencies |
| `yarn example:start` | Start Metro |
| `yarn example:start:dev` | Start Metro with `--reset-cache` (use if changes don't appear) |
| `yarn example:ios` | Run on iOS |
| `yarn example:android` | Run on Android |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React Native |
| **Graphics** | Skia (`@shopify/react-native-skia`) |
| **Animations** | React Native Reanimated |
| **Gestures** | React Native Gesture Handler |
| **State / Streams** | RxJS |

---

## License

MIT
