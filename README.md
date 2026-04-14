# PromptPal

[![Expo](https://img.shields.io/badge/Expo-48.0.0-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.73.0-blue)](https://reactnative.dev)
[![Convex](https://img.shields.io/badge/Convex-1.8.0-orange)](https://convex.dev)
[![Clerk](https://img.shields.io/badge/Clerk-1.2.0-purple)](https://clerk.dev)
[![Progress](https://img.shields.io/badge/Completion-70%25-yellow)](https://github.com/mwijanarko1/Prompt-Pal-App)
[![Launch](https://img.shields.io/badge/Launch-March%2020%2C%202026-green)](https://github.com/mwijanarko1/Prompt-Pal-App)

**🚀 Major Milestone: 100% Convex Migration Complete!**

A gamified AI prompt engineering learning app built with React Native, Expo, and Convex. Currently **70% complete** with backend fully migrated to serverless architecture.

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
│  │          │  │          │  │  ┌─────┐ │  │          │    │
│  │          │  │          │  │  │🎯AI │ │  │          │    │
│  │          │  │          │  │  │Hint │ │  │          │    │
│  │          │  │          │  │  └─────┘ │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Zustand Stores │
              │  - Game State   │
              │  - User XP      │
              │  - Progress     │
              │  - Achievements │
              └────────┬────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│   Convex    │ │   Clerk     │ │   Gemini    │
│  Backend    │ │    Auth     │ │    AI       │
│  ┌────────┐ │ │             │ │  ┌──────┐  │
│  │Scoring │ │ │             │ │  │2.5   │  │
│  │Engine  │ │ │             │ │  │Flash │  │
│  └────────┘ │ │             │ │  └──────┘  │
└─────────────┘ └─────────────┘ └─────────────┘
```

**✅ Backend Complete (95%)** | **⚠️ Content (60%)** | **⚠️ UI Components (15%)**

---

## ✅ Current Status & Features

### 🏆 Major Achievements
- **✅ 100% Convex Migration** - Complete backend modernization to serverless
- **✅ Nano Assistant AI** - Intelligent hint system powered by Gemini AI
- **✅ Scoring Engine** - Automated evaluation for all prompt types
- **✅ Achievement System** - Gamified learning with XP and badges
- **✅ Real-time Sync** - Instant data updates across all devices

### 📊 Project Progress (February 9, 2026)
- **Overall Completion**: **70%**
  - Backend/Services: **95%** ✅
  - Content Creation: **60%** ⚠️ (9/18 levels complete)
  - UI Components: **15%** ⚠️

### 🎯 Key Features
- **🎨 Image Generation** - Master DALL-E, Midjourney, Stable Diffusion prompts
- **💻 Code Generation** - Learn to prompt AI for programming tasks
- **✍️ Copywriting** - Craft compelling marketing copy and content
- **🎯 AI Hints** - Get intelligent assistance when stuck
- **🏆 Leaderboards** - Compete globally with daily/weekly rankings
- **📈 Progress Tracking** - XP system with streaks and achievements

### 🚀 Roadmap to Launch
- **Expected Launch**: **March 20, 2026**
- **Next Sprint**: Complete critical UI components + intermediate levels
- **Team Progress**: Mikhail (100%), Sabina (25%), Yasar (0%), Khalid (19%)

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

### Production Builds (TestFlight / App Store)

Local `.env` files are not bundled into EAS builds. Configure environment variables via EAS Secrets before building. See [docs/operations/DEPLOYMENT.md](../docs/operations/DEPLOYMENT.md) for setup instructions.

---

## 📁 Project Structure

```
PromptPal/
├── convex/                    # Convex backend (95% complete)
│   ├── queries.ts            # Read operations
│   ├── mutations.ts          # Write operations
│   ├── ai.ts                 # AI operations (Gemini integration)
│   ├── auth.config.ts        # Clerk JWT config
│   ├── achievements.ts       # Achievement system
│   ├── analytics.ts          # User analytics
│   ├── apps.ts               # App management
│   ├── crons.ts              # Scheduled tasks
│   ├── levels_data.ts        # Level definitions
│   ├── rankings.ts           # Leaderboard logic
│   ├── schema.ts             # Database schema
│   ├── seed.ts               # Initial data
│   └── _generated/           # Auto-generated types
├── src/
│   ├── app/                  # Expo Router screens
│   │   ├── (auth)/          # Auth flow
│   │   ├── (tabs)/          # Main app tabs
│   │   │   ├── index.tsx    # Home dashboard
│   │   │   ├── library.tsx  # Learning modules
│   │   │   ├── ranking.tsx  # Leaderboard
│   │   │   └── profile.tsx  # User profile
│   │   ├── game/            # Game screens
│   │   │   ├── [id].tsx     # Game session
│   │   │   └── levels/      # Level selection
│   │   └── _layout.tsx      # Root layout
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── ErrorBoundary.tsx # Error handling
│   ├── features/            # Feature-based modules
│   │   ├── game/           # Game state & logic
│   │   │   ├── components/  # Game UI components
│   │   │   ├── store.ts    # Game state management
│   │   │   └── utils/      # Game utilities
│   │   ├── user/           # User progress & XP
│   │   ├── achievements/   # Achievement system
│   │   ├── levels/         # Level definitions & data
│   │   └── onboarding/     # User onboarding flow
│   └── lib/                 # Utilities & services
│       ├── convex-client.ts # Convex HTTP client
│       ├── auth*.ts        # Auth utilities
│       ├── syncManager.ts  # Background sync
│       ├── usage.ts        # Usage tracking
│       ├── nanoAssistant.ts # AI hint system
│       ├── scoring/        # Automated evaluation
│       │   ├── index.ts
│       │   ├── codeScoring.ts
│       │   ├── copyScoring.ts
│       │   └── imageScoring.ts
│       ├── animations.ts   # UI animations
│       └── sound.ts        # Audio management
├── docs/                    # Documentation
│   ├── CONVEX_MIGRATION.md # Migration guide
│   ├── CODEBASE_MAP.md     # Architecture docs
│   ├── API_DOCS.md         # API documentation
│   ├── feb-9-report.md     # Latest progress report
│   └── phases/             # Development phases
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

### AI Features

**Nano Assistant** - Intelligent hint system powered by Gemini AI:

```typescript
import { nanoAssistant } from '@/lib/nanoAssistant';

// Get contextual hints during gameplay
const hint = await nanoAssistant.getHint({
  levelType: 'image',
  userPrompt: 'sunset over mountains',
  difficulty: 'intermediate'
});
```

**Automated Scoring** - AI-powered evaluation for all prompt types:

```typescript
import { scorePrompt } from '@/lib/scoring';

// Evaluate user prompts automatically
const score = await scorePrompt({
  type: 'image',
  userPrompt: 'beautiful landscape',
  aiResponse: '...',
  criteria: ['creativity', 'specificity', 'clarity']
});
```

---

## 🏆 Achievement System

Track progress with XP, streaks, and unlockable achievements:

- **Daily Streaks** - Maintain consecutive learning days
- **Level Mastery** - Complete all levels in a category
- **Prompt Quality** - Earn high scores on challenging prompts
- **Speed Challenges** - Complete levels quickly
- **Global Rankings** - Compete on leaderboards

---

## 📚 Documentation

### Project Documentation
- **[February 9 Progress Report](docs/reports/feb-9-report.md)** - Latest project status (70% complete)
- **[Convex Migration Guide](docs/operations/CONVEX_MIGRATION.md)** - Complete migration documentation
- **[Codebase Map](docs/CODEBASE_MAP.md)** - Architecture and navigation guide
- **[API Documentation](docs/reference/API_DOCS.md)** - Backend API reference
- **[Development Phases](docs/phases/)** - Sprint planning and milestones

### External Resources
- **[Convex Docs](https://docs.convex.dev)** - Official Convex documentation
- **[Clerk Docs](https://clerk.dev/docs)** - Official Clerk documentation
- **[React Native Docs](https://reactnative.dev)** - React Native documentation
- **[Expo Docs](https://docs.expo.dev)** - Expo framework documentation

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

## 👥 Team & Progress

**PromptPal Development Team** (February 9, 2026)

| Team Member | Role | Progress | Completion |
|-------------|------|----------|------------|
| **Mikhail** | Lead Developer | Backend Migration | **100%** ✅ |
| **Sabina** | UI/UX Developer | Component Development | **25%** ⚠️ |
| **Yasar** | Content Creator | Level Design | **0%** 📋 |
| **Khalid** | QA & Testing | Quality Assurance | **19%** ⚠️ |

**Current Sprint**: Complete critical UI components + intermediate levels
**Target Launch**: March 20, 2026
**Overall Progress**: 70%

---

**Built with ❤️ by the PromptPal Team**

*Currently in active development with major backend milestone complete*

[GitHub](https://github.com/mwijanarko1/Prompt-Pal-App) • [Progress Reports](docs/)
