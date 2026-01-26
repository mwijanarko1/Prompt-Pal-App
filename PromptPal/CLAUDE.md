# PromptPal

A gamified AI prompt engineering learning app built with React Native and Expo.

## Codebase Overview

PromptPal helps users learn AI prompt engineering through interactive challenges across three domains: image generation, coding, and copywriting. Users earn XP, maintain streaks, complete daily quests, and compete on global leaderboards.

**Tech Stack**: React Native, Expo Router, Zustand, Clerk Auth, NativeWind/Tailwind
**Structure**: File-based routing with feature-based state management

## Key Files

| Category | Location |
|----------|----------|
| App entry | `src/app/_layout.tsx` |
| Screens | `src/app/(tabs)/` |
| State stores | `src/features/*/store.ts` |
| API clients | `src/lib/api.ts`, `src/lib/aiProxy.ts` |
| UI components | `src/components/ui/` |
| Utilities | `src/lib/` |

## Quick Start

**Adding a new screen**: Create file in `src/app/(tabs)/` or appropriate route group

**Adding state**: Create store in `src/features/{feature}/store.ts`

**Adding API endpoint**: Add method to `src/lib/api.ts`

**Modifying auth**: See `src/lib/auth*.ts*` files

## Documentation

For detailed architecture, module documentation, and navigation guides, see [docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md).
