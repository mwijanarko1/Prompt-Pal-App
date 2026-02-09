# PromptPal

[![Expo](https://img.shields.io/badge/Expo-48.0.0-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.73.0-blue)](https://reactnative.dev)
[![Convex](https://img.shields.io/badge/Convex-1.8.0-orange)](https://convex.dev)
[![Clerk](https://img.shields.io/badge/Clerk-1.2.0-purple)](https://clerk.dev)

A gamified AI prompt engineering learning app built with React Native, Expo, and Convex.

## 🎯 What is PromptPal?

PromptPal helps users learn AI prompt engineering through interactive challenges across three domains:
- 🎨 **Image Generation** - Master visual AI prompts
- 💻 **Coding** - Learn to prompt AI for code
- ✍️ **Copywriting** - Craft compelling AI-generated text

Users earn XP, maintain daily streaks, complete quests, and compete on global leaderboards.

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native + Expo |
| **Navigation** | Expo Router (file-based) |
| **State** | Zustand (local) + Convex (server) |
| **Backend** | Convex (serverless) |
| **Auth** | Clerk with JWT |
| **AI** | Google Gemini 2.5 Flash |
| **Styling** | NativeWind (Tailwind) |
| **Storage** | expo-secure-store |

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Home   │  │ Library  │  │   Game   │  │ Profile  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Zustand Stores │
              │  - Game State   │
              │  - User XP      │
              │  - Progress     │
              └────────┬────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   Convex    │ │   Clerk     │ │   Gemini    │
│  Backend    │ │    Auth     │ │    AI       │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Convex CLI (`npm install -g convex`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PromptPal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   # From Convex dashboard
   EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   
   # From Clerk dashboard
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev
   ```

4. **Start Convex dev server** (in separate terminal)
   ```bash
   npx convex dev
   ```

5. **Run the app**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

---

## 📁 Project Structure

```
PromptPal/
├── convex/                    # Convex backend
│   ├── queries.ts            # Read operations
│   ├── mutations.ts          # Write operations
│   ├── ai.ts                 # AI operations
│   ├── auth.config.ts        # Clerk JWT config
│   └── _generated/           # Auto-generated types
├── src/
│   ├── app/                  # Expo Router screens
│   │   ├── (auth)/          # Auth flow
│   │   ├── (tabs)/          # Main app tabs
│   │   │   ├── index.tsx    # Home dashboard
│   │   │   ├── library.tsx  # Learning modules
│   │   │   ├── ranking.tsx  # Leaderboard
│   │   │   └── profile.tsx  # User profile
│   │   └── _layout.tsx      # Root layout
│   ├── components/           # React components
│   │   └── ui/              # Reusable UI components
│   ├── features/            # Feature-based modules
│   │   ├── game/           # Game state & logic
│   │   ├── user/           # User progress & XP
│   │   ├── achievements/   # Achievement system
│   │   └── levels/         # Level definitions
│   └── lib/                 # Utilities & services
│       ├── convex-client.ts # Convex HTTP client
│       ├── auth*.ts        # Auth utilities
│       ├── syncManager.ts  # Background sync
│       └── usage.ts        # Usage tracking
├── docs/                    # Documentation
│   ├── CONVEX_MIGRATION.md # Migration guide
│   └── CODEBASE_MAP.md     # Architecture docs
└── assets/                  # Images, fonts, etc.
```

---

## 💻 Development

### Adding a New Feature

1. **Create Convex function** (if backend needed):
   ```typescript
   // convex/queries.ts or mutations.ts
   export const myFeature = query({
     args: { userId: v.string() },
     handler: async (ctx, args) => {
       // Implementation
     }
   });
   ```

2. **Create screen**:
   ```bash
   touch src/app/(tabs)/my-feature.tsx
   ```

3. **Add state** (if needed):
   ```bash
   touch src/features/my-feature/store.ts
   ```

### Common Commands

```bash
# Start development
npm start

# Run tests
npm test

# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Convex commands
npx convex dev          # Start dev server
npx convex deploy       # Deploy to production
npx convex codegen      # Generate types
npx convex dashboard    # Open dashboard
```

---

## 🔑 Key Concepts

### Authentication

We use **Clerk** for authentication with automatic JWT token management:

```typescript
// In your component
import { useUser, useAuth } from '@clerk/clerk-expo';

const { user } = useUser();
const { isSignedIn } = useAuth();
```

Tokens are automatically cached and refreshed. No manual management needed!

### Backend (Convex)

All backend logic lives in the `convex/` folder:

- **Queries** (`queries.ts`): Read operations (getLevels, getLeaderboard)
- **Mutations** (`mutations.ts`): Write operations (updateProgress, completeLevel)
- **AI** (`ai.ts`): AI operations (generateImage, evaluateImage)

Use in React components:
```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const data = useQuery(api.queries.getLevels);
```

Use in services:
```typescript
import { convexHttpClient } from "@/lib/convex-client";
const data = await convexHttpClient.query(api.queries.getLevels);
```

### State Management

- **Zustand** for local state (game progress, XP)
- **Convex** for server state (leaderboard, levels)
- **expo-secure-store** for persistence

---

## 📚 Documentation

- **[Convex Migration Guide](docs/CONVEX_MIGRATION.md)** - Complete migration documentation
- **[Codebase Map](docs/CODEBASE_MAP.md)** - Architecture and navigation guide
- **[Convex Docs](https://docs.convex.dev)** - Official Convex documentation
- **[Clerk Docs](https://clerk.dev/docs)** - Official Clerk documentation

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run e2e

# Run specific test file
npm test -- MyComponent.test.tsx
```

---

## 🚢 Deployment

### Production Deployment

1. **Deploy Convex backend**:
   ```bash
   npx convex deploy
   ```

2. **Configure production environment**:
   - Set production Convex URL
   - Set production Clerk keys
   - Update `CLERK_JWT_ISSUER_DOMAIN`

3. **Build for stores**:
   ```bash
   # iOS
   eas build --platform ios
   
   # Android
   eas build --platform android
   ```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

### Code Standards

- Use TypeScript for all new code
- Follow existing file structure
- Add types for all function parameters
- Use the logger utility for debugging
- Follow React Native best practices

---

## 🐛 Troubleshooting

### Common Issues

**"InvalidAuthHeader" error**
- Ensure `CLERK_JWT_ISSUER_DOMAIN` is set in Convex dashboard
- Check user is signed in
- Restart `npx convex dev`

**"Could not find API" error**
- Run `npx convex codegen` to regenerate types
- Check function name matches in `convex/` folder

**App won't start**
- Check all environment variables are set
- Ensure `npx convex dev` is running
- Clear metro cache: `npx expo start --clear`

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Powered by [Convex](https://convex.dev)
- Authentication by [Clerk](https://clerk.dev)
- AI by [Google Gemini](https://ai.google.dev)

---

**Built with ❤️ by the PromptPal Team**

[Website](https://your-website.com) • [Twitter](https://twitter.com/your-handle) • [Discord](https://discord.gg/your-invite)
