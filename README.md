# Sliding Blocks Puzzle (React Native)

A **high-performance** puzzle game built with React Native and TypeScript—slide blocks, fill rows, clear them for points, and watch everything cascade down. Runs great on both iOS and Android with smooth 60fps thanks to Skia, Reanimated, and worklets.

React Native is rarely the first tool that comes to mind for game development, but that's precisely what made this an interesting challenge. This project is an attempt to bridge the gap between the declarative UI patterns of React and the performance demands of real-time interaction. I hope it provides a helpful reference for others navigating the same intersection—proving that with the right combination of tools (Skia, Reanimated, and a solid state architecture), you can build experiences that feel far more native than the tech stack might suggest.

## About the App

**Sliding Blocks** is a match-style puzzle where you slide colorful segments around a grid. Fill a row completely and it clears—score points, watch blocks fall with gravity, and new rows keep coming from the top. Simple to pick up, satisfying to master.

### Game Mechanics

- **Grid** — 8 columns × 10 rows of cells
- **Blocks** — Colored segments of varying lengths (1–4 cells). Drag them left or right to reposition.
- **Clearing** — Fill a row completely (8 cells) to clear it. Segments disappear and blocks above drop.
- **Super segments** — Rare black segments that, when cleared, also wipe overlapping blocks in adjacent rows. Handy for chain combos.
- **Score & multiplier** — Animated display so you can track your progress as you go.
- **Restart** — Fresh start whenever you need one.

### Architecture

The app uses **MVVM** with RxJS and Reanimated. ViewModels hold game logic; Views render Skia Canvas nodes driven by SharedValues. A single **Engine** facade composes ViewModels and exposes a React-agnostic API. See [Architectural Concepts](#architectural-concepts) below for the key design principles.

## Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React Native 0.84 |
| **Language** | TypeScript 5.8 |
| **React** | React 19.2 |
| **Graphics** | Skia (via `@shopify/react-native-skia`) |
| **Animations** | React Native Reanimated 4.x |
| **Gestures** | React Native Gesture Handler |
| **State / Streams** | RxJS 7.x |
| **Platforms** | iOS, Android |

**Requirements**: Node.js ≥ 22.11.0 (you’ll need this before running the app)

## Architectural Concepts

The architecture is built around a few core principles:

- **No React commits during gameplay** — Game state (score, items, gestures, overlays) is held in RxJS streams and Reanimated SharedValues. The bridge (`useEngineBridge`) subscribes to RxJS and writes into SharedValues. React components never call `setState` or `useReducer` for game logic. Re-renders only occur on mount and rare layout changes (e.g. rotation).

- **Pre-rendered UI** — The Skia Canvas declares all nodes (grid, 48 item slots, ghost, indicator, game-over overlay) upfront. Nothing is conditionally mounted from game state. Visibility and position are driven purely by SharedValues. No `{condition && <Component />}` that would trigger reconciliation.

- **Single binding point** — One `useEngineBridge` hook wires all engine streams to SharedValues. No per-component subscriptions or BinderHooks. Subscriptions are created once and cleaned up on unmount.

- **React-agnostic engine** — `GameEngine` and its ViewModels (GameViewModel, GestureCoordinator, ItemViewModel) have no React or Reanimated imports. They can be unit-tested without a renderer and reused from non-React entry points.

- **MVVM layering** — **Model** (domain: ProcessData, fit, remove, generate, types). **ViewModels** (presentation: GameViewModel, GestureCoordinator, ItemViewModel, GameEngine). **Binding** (engine: RxJS → SharedValues). **View** (React components that render the Canvas).

### Reusing for New Games

The **`core/`** folder holds game-agnostic pieces you can copy into new projects:

- **`core/binding/`** — `BinderHook`, `DisposeBag`, `useStreamBridge` for RxJS → SharedValues
- **`core/CONCEPTS.md`** — Describes the patterns, how to apply them, and a step-by-step recipe for a new game

Use `core` for the bridge pattern; keep game logic (model, viewmodels, engine) in your game module.

## Performance & Technical Approach

We aimed for **smooth, responsive gameplay** and leaned on a few solid patterns:

- **Skia rendering** — `@shopify/react-native-skia` uses the same 2D engine as Chrome. Drawing happens on the native thread, so we avoid flooding the JS bridge.
- **Reanimated + Worklets** — Animations and gesture feedback run on the UI thread. Touch feels instant, and we steer clear of JS-thread jank.
- **Reactive state** — RxJS streams drive game logic. SharedValues drive the UI. The bridge is the only place that connects them.
- **Pre-rendered canvas** — All Skia nodes exist from the start; SharedValues control opacity, position, and size. No reconciliation from game state.
- **Batched processing** — The game loop uses batched tasks and binary search for gap/overlap checks, keeping per-frame work light.
- **TypeScript** — Strict typing and clear interfaces for safer refactors and predictable behavior.

All of that adds up to smooth 60fps, snappy touch response, and efficient resource use on both iOS and Android.

## Packages

Here’s what powers the game under the hood:

### Core Dependencies

| Package | Purpose |
|---------|---------|
| `react` / `react-native` | UI framework & native bridge |
| `@shopify/react-native-skia` | Skia-based 2D graphics & canvas |
| `react-native-reanimated` | High-performance animations |
| `react-native-gesture-handler` | Touch and gesture handling |
| `react-native-worklets` | Run JS on UI thread |
| `rxjs` | Reactive streams for game state |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-svg` | SVG support |
| `react-native-sound-player` | Audio playback |

### Dev Dependencies

- **Build / tooling**: `@react-native-community/cli`, `@react-native/babel-preset`, `@react-native/metro-config`
- **TypeScript**: `typescript`, `@react-native/typescript-config`, `@tsconfig/react-native`
- **Linting**: `eslint`, `prettier`, `@typescript-eslint/*`, `eslint-plugin-simple-import-sort`, `eslint-plugin-unused-imports`
- **Testing**: `react-test-renderer`, `@types/react-test-renderer`

## Project Structure

```
├── src/
│   ├── core/                   # Reusable across games (see core/CONCEPTS.md)
│   │   ├── binding/            # BinderHook, DisposeBag, useStreamBridge
│   │   └── CONCEPTS.md         # No commits, pre-rendered UI, patterns, recipe for new games
│   ├── model/                  # Domain layer
│   ├── viewmodels/             # Presentation logic
│   ├── engine/                 # Game-specific binding (uses core)
│   ├── components/             # View layer
│   ├── hooks/
│   ├── utils/
│   ├── consts.ts, types.ts     # Re-exports from model
├── ios/
├── android/
├── index.js
└── app.json
```

## Getting Started

Clone the repo, install dependencies, and you're good to go:

```bash
# Install dependencies
yarn install
# or: npm install

# Start Metro bundler
yarn start

# Run on iOS (in another terminal)
yarn ios

# Or run on Android
yarn android
```

Make sure you have the React Native environment set up for [iOS](https://reactnative.dev/docs/environment-setup) or [Android](https://reactnative.dev/docs/environment-setup). Then fire up the app and enjoy.

### Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start Metro bundler |
| `yarn ios` | Run on iOS simulator/device |
| `yarn android` | Run on Android emulator/device |
| `yarn lint` | Run ESLint on source files |

## Plans / TODO

- **Improve design** — Polish UI, theming, and visual feedback (e.g. clear animations, particle effects).
- **Persist state** — Save game state (and optionally high score) so players can resume or compare runs.
- **Better score calculation** — Richer scoring (combo bonuses, super-segment rewards, difficulty scaling).
- **Sound & haptics** — Tie in `react-native-sound-player` and haptic feedback for clears and moves.
- **Difficulty / settings** — Configurable grid size, speed, or difficulty levels for replayability.

## License

MIT License — free for personal and commercial use. Go ahead and tinker, share, or build on it.
