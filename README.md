# Sliding Blocks Puzzle (React Native)

A **high-performance** puzzle game built with React Native and TypeScript—slide blocks, fill rows, clear them for points, and watch everything cascade down. Runs great on both iOS and Android with smooth 60fps thanks to Skia, Reanimated, and worklets.

React Native is rarely the first tool that comes to mind for game development, but that's precisely what made this an interesting challenge. This project is an attempt to bridge the gap between the declarative UI patterns of React and the performance demands of real-time interaction. I hope it provides a helpful reference for others navigating the same intersection—proving that with the right combination of tools (Skia, Reanimated, and a solid state architecture), you can build experiences that feel far more native than the tech stack might suggest.

## About the App

**Sliding Blocks** is a match-style puzzle where you slide colorful segments around a grid. Fill a row completely and it clears—score points, watch blocks fall with gravity, and new rows keep coming from the top. Simple to pick up, satisfying to master.

### Game Mechanics

- **Grid** — 8 columns × 10 rows of cells (configurable)
- **Blocks** — Colored segments of varying lengths (1–4 cells). Drag them left or right to reposition.
- **Clearing** — Fill a row completely to clear it. Segments disappear and blocks above drop.
- **Super segments** — Rare black segments that, when cleared, also wipe overlapping blocks in adjacent rows. Handy for chain combos.
- **Score & multiplier** — Animated display so you can track your progress as you go.
- **Restart** — Fresh start whenever you need one.

### Architecture

The app uses **MVVM** with RxJS and Reanimated. ViewModels hold game logic; Views render Skia Canvas nodes driven by SharedValues. A single **Engine** facade composes ViewModels and exposes a React-agnostic API. See [slidingBlocks/CONCEPTS.md](slidingBlocks/CONCEPTS.md) for the full architectural guide.

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

**Requirements**: Node.js ≥ 22.11.0 (you'll need this before running the app)

## SlidingBlocks Module

The game lives in the **`slidingBlocks/`** folder—a self-contained module with no bundled assets or side effects. The host app provides everything:

| Responsibility | Host provides |
|----------------|---------------|
| **Config** | Grid size, layout, settings |
| **Assets** | Block images, background image (optional; fallbacks: solid color bg, Skia-drawn blocks) |
| **Sounds** | Via callbacks: `onRemovingStart` (row clear), `onFitComplete` with `{ hadActualFit }` (slide) |
| **Persistence** | Score, high score, settings via callbacks |

### APIs

- **Declarative**: `<SlidingBlocks config={...} callbacks={...} assets={...} />` — all-in-one component
- **Composable**: `useSlidingBlocks(props)` → `{ Root, ScoreBar, GameArea, ref }` — build custom layouts
- **Low-level**: `GameRootView` — minimal wrapper when you need full control

## Architectural Concepts

The architecture is built around a few core principles:

- **No React commits during gameplay** — Game state is held in RxJS streams and Reanimated SharedValues. The bridge (`useEngineBridge`) subscribes to RxJS and writes into SharedValues. React components never call `setState` for game logic.

- **Pre-rendered UI** — The Skia Canvas declares all nodes upfront. Visibility and position are driven purely by SharedValues. No reconciliation from game state.

- **Single binding point** — One `useEngineBridge` hook wires all engine streams to SharedValues.

- **React-agnostic engine** — `GameEngine` and its ViewModels have no React or Reanimated imports. They can be unit-tested without a renderer.

- **Host owns side effects** — Sound, persistence, and analytics are injected via callbacks. SlidingBlocks knows nothing about platforms or external services.

## Performance & Technical Approach

- **Skia rendering** — Drawing happens on the native thread.
- **Reanimated + Worklets** — Animations and gesture feedback run on the UI thread.
- **Reactive state** — RxJS streams drive game logic; SharedValues drive the UI.
- **Batched processing** — Batched tasks and binary search keep per-frame work light.

## Packages

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
| `react-native-sound-player` | Audio (used by host app; not by slidingBlocks) |

### Dev Dependencies

- **Build / tooling**: `@react-native-community/cli`, `@react-native/babel-preset`, `@react-native/metro-config`
- **TypeScript**: `typescript`, `@react-native/typescript-config`, `@tsconfig/react-native`
- **Linting**: `eslint`, `prettier`, `@typescript-eslint/*`, `eslint-plugin-simple-import-sort`, `eslint-plugin-unused-imports`
- **Testing**: `react-test-renderer`, `@types/react-test-renderer`

## Project Structure

```
├── slidingBlocks/              # Game module (no bundled assets, host injects everything)
│   ├── engine/                 # Pure game logic, RxJS, no React
│   │   ├── core/               # BinderHook, pipeline, binding utilities
│   │   ├── model/              # Domain types, fit, remove, generate
│   │   └── viewmodels/         # GameViewModel, GestureCoordinator, TaskPipeline
│   ├── bridge/                 # RxJS → SharedValues (useEngineBridge, GestureCompletionOrchestrator)
│   ├── ui/                     # React components, Skia, contexts
│   ├── config.ts               # computeGameConfig, toEngineConfig
│   ├── types.ts                # GameLayoutSettings, BlockSettings, etc.
│   └── CONCEPTS.md             # Architectural patterns and recipe for new games
├── src/                        # Host app
│   ├── screens/                # GameScreen, ComposableGameScreen
│   ├── assets/                 # slidingBlocksAssets (block images, bg) — host provides
│   ├── theme/
│   └── hooks/
├── assets/                     # App assets (blocks, bg, icons)
├── ios/
├── android/
├── index.js
└── app.json
```

## Getting Started

```bash
yarn install
yarn start
yarn ios    # or: yarn android
```

Make sure you have the React Native environment set up for [iOS](https://reactnative.dev/docs/environment-setup) or [Android](https://reactnative.dev/docs/environment-setup).

### Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start Metro bundler |
| `yarn ios` | Run on iOS simulator/device |
| `yarn android` | Run on Android emulator/device |
| `yarn lint` | Run ESLint on source files |

## Plans / TODO

- **Improve design** — Polish UI, theming, and visual feedback.
- **Persist state** — Save game state and high score so players can resume.
- **Better score calculation** — Combo bonuses, super-segment rewards, difficulty scaling.
- **Difficulty / settings** — Configurable grid size, speed, or difficulty levels.

## License

MIT License — free for personal and commercial use.
