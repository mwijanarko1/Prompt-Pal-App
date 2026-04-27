# PromptPal

PromptPal is a mobile app for learning prompt engineering through short, replayable game loops. This repository is a single project root: the Expo / React Native app, Convex backend, and assets live here alongside [`docs/`](docs/) (plans, maps, operations) and [`tasks/`](tasks/).

![Status](https://img.shields.io/badge/Status-Active%20Development-yellow?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Expo%20%2B%20React%20Native-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)

## Overview

The product is built around three learning tracks:

- Image prompt challenges
- Code and logic prompt challenges
- Copywriting prompt challenges

Players progress through levels, submit prompts, receive AI-assisted feedback, and improve over repeated attempts. Authentication is handled through Clerk, backend state and AI orchestration run through Convex, and the client is built with Expo Router, React Native, and TypeScript.

## Current state

The codebase includes the main app shell, authentication flow, tab navigation, core game state, and Convex-backed AI integration. Recent work has focused on simplifying the app root, stabilizing safe mode, using Bun as the package manager, and restructuring scoring logic for the copy module.

### Recent progress (from `main`)

- Safe mode cleanup and root simplification (consolidated app entry flow)
- Bun lockfile and script usage alongside Convex schema and gameplay updates
- Refactoring of copy scoring into `copyScoringCore.ts` and addition of `promptQuality.ts`
- Tab and game screen updates across home, library, ranking, profile, and game flows

Areas still in motion: expanding level content, end-to-end scoring validation, broader tests, and release polish.

For architecture and navigation, see [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md). For App Store compliance notes, see [`docs/ios-app-store-compliance-report.md`](docs/ios-app-store-compliance-report.md).

## Repository layout

```text
.
├── src/app/              # Expo Router routes and layouts
├── src/components/       # Shared UI components
├── src/features/         # Feature domains and stores
├── src/lib/              # Shared services and utilities
├── convex/               # Backend schema, queries, mutations, AI
├── assets/               # Fonts, images, static assets
├── docs/                 # CODEBASE_MAP, plans, phases, reports, operations
├── tasks/                # Task tracking and notes
├── app.json              # Expo configuration
├── eas.json              # EAS Build profiles
├── package.json          # Scripts and dependencies
└── README.md             # This file
```

## Quick start

1. Clone the repository and open the project root (no nested `cd` into an app folder).

   ```bash
   git clone https://github.com/mwijanarko1/Prompt-Pal-App.git
   cd Prompt-Pal-App
   ```

2. Install dependencies.

   ```bash
   bun install
   ```

3. Copy the environment template and fill in the required values.

   ```bash
   cp .env.example .env
   ```

4. In a separate terminal, start the Convex development server.

   ```bash
   bun run convex:dev
   ```

5. Start the Expo development server.

   ```bash
   bun start
   ```

## Environment

The app expects these public environment variables at minimum:

- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_CONVEX_SITE_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`
- `CONVEX_DEPLOYMENT`

Optional:

- `EXPO_PUBLIC_SAFE_MODE` (set to `1` to force the safe-mode `BootModeScreen` crash isolation screen)

See [`.env.example`](.env.example) and [`src/lib/env.ts`](src/lib/env.ts) when adding variables.

## Common commands

From the repository root:

```bash
bun start
bun run convex:dev
bun run validate-env
```

Use [`package.json`](package.json) as the source of truth for scripts.

## Contributing

Keep changes small, typed, and aligned with the existing architecture.

- Use Conventional Commits.
- Run `bun run validate-env` before opening a PR.
- Review [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md) before large structural changes.

## Links

- Repository: [github.com/mwijanarko1/Prompt-Pal-App](https://github.com/mwijanarko1/Prompt-Pal-App)
- Issues: [GitHub Issues](https://github.com/mwijanarko1/Prompt-Pal-App/issues)
- Discussions: [GitHub Discussions](https://github.com/mwijanarko1/Prompt-Pal-App/discussions)

Planning history, phased rollout notes, and operational runbooks live under [`docs/plans/`](docs/plans/), [`docs/phases/`](docs/phases/), and [`docs/operations/`](docs/operations/) (including App Store upload and database seeding).
