# SchoolVan 🚐

Two mobile apps for school van / student transport, built with **Expo (React Native)** so they run on both **iOS and Android** from one codebase:

- **Driver app** (`apps/driver`) — switch between the **morning** (home → school) and **afternoon** (school → home / designated drop-off) runs, mark each child picked up or dropped off, and toggle live-location sharing. Every action notifies the parent.
- **Parent app** (`apps/parent`) — live van tracking with ETA, each child's status for **both** daily windows, and an alerts feed that fills as the driver acts.

Both apps share domain models, mock API, and brand tokens from `packages/shared`.

## Layout

```
schoolvan/
├── apps/
│   ├── driver/          # Expo app — driver experience
│   └── parent/          # Expo app — parent experience
├── packages/
│   └── shared/          # @schoolvan/shared: types, mock API, theme tokens
└── package.json         # npm workspaces
```

This is an **npm workspaces** monorepo. Both apps import `@schoolvan/shared` directly
from source; each app's `metro.config.js` watches the workspace so edits to the shared
package hot-reload.

## Getting started

Install everything from the repo root:

```bash
npm install
```

Run an app (opens the Expo dev server — press `i` for iOS simulator, `a` for Android):

```bash
npm run driver
```

```bash
npm run parent
```

Or from the app folder directly:

```bash
cd apps/driver && npm run ios
```

Type-check both apps:

```bash
npm run typecheck
```

## Tech

- Expo SDK 58 · React Native 0.88 · React 19
- Expo Router (file-based routing, `src/app`)
- TypeScript (strict)

## Current state & next steps

This is a working scaffold with **mock data** — the apps render real-looking routes,
students, and alerts from an in-memory store in `packages/shared/src/api.ts`. The driver
app and parent app stay in sync through that store during a session: a school day has two
trips (morning and afternoon), and marking a child picked up or dropped off in the driver
app generates a notification that appears in the parent app's Alerts tab.

Not yet wired up (natural next steps):

- **Auth** — login screens and a real user session (the "Sign out" button is a stub).
- **Backend** — replace the mock functions in `packages/shared/src/api.ts` with real
  network calls; the signatures are meant to stay stable.
- **Live maps** — drop `react-native-maps` into the parent Track screen's map placeholder.
- **Real-time location** — push driver GPS (e.g. `expo-location` + websockets) instead of
  the simulated `updateVanLocation`.
- **Push notifications** — deliver alerts via `expo-notifications`.
