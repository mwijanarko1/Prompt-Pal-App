# 🎮 PromptPal

**Master the Art of AI Prompt Engineering**

An innovative multi-module mobile game that teaches players to craft perfect AI prompts across three domains: image generation, coding, and copywriting. Master the art of communicating with AI through gamified challenges and real-time feedback.

![PromptPal Banner](https://img.shields.io/badge/Status-Phase%201%20Complete-success?style=for-the-badge)
![Modules](https://img.shields.io/badge/Modules-3%20(Image%2C%20Code%2C%20Copy)-blue?style=for-the-badge)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-black?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)

## 🌟 Features

### ✅ Current Features (Phase 1 Complete)
- **🎨 Dark Theme UI**: Beautiful, consistent dark mode design with custom color palette
- **🏆 Multi-Module Level System**: Progressive difficulty across three AI domains
- **📱 Module-Adaptive UI**: Dynamic interfaces for Image, Code, and Copywriting challenges
- **💾 Persistent Progress**: Game state saved securely using Expo SecureStore
- **🔄 Mock AI Integration**: Realistic simulation for all three modules
- **❤️ Lives System**: Limited attempts per level with retry mechanics
- **🎯 Module Filtering**: Switch between Image, Code, and Copywriting challenges

### 🚀 Upcoming Features (Phase 2-5)
- **🤖 Real Gemini API**: Integration with Google's Gemini 1.5 Pro, Imagen, and Vision models
- **🧠 "Nano Banana"**: Local Gemini Nano AI assistance on supported Android devices
- **💻 Code Execution Engine**: Sandbox environment for testing generated code
- **📝 Content Analysis AI**: Advanced copywriting evaluation and feedback
- **📊 Advanced Scoring**: AI-powered analysis across all three modules (0-100% accuracy)
- **🎪 Interactive UI**: Before/after comparisons, animated counters, loading terminals
- **📈 Progress Analytics**: Detailed statistics and improvement tracking per module

## 🛠️ Technology Stack

### Core Framework
- **Expo SDK 54**: Latest Expo platform for cross-platform development
- **React Native 0.81.5**: Modern React Native with new architecture
- **TypeScript 5.9**: Type-safe development with latest TypeScript features

### UI & Styling
- **NativeWind**: Tailwind CSS for React Native
- **React Native Safe Area Context**: Proper notch and edge handling
- **Expo Router**: File-based routing and navigation

### State Management
- **Zustand**: Lightweight, scalable state management
- **Expo SecureStore**: Encrypted persistent storage

### AI Integration (Phase 2)
- **Google Gemini API**: Advanced multimodal AI for image generation and analysis
- **Gemini Nano**: On-device AI for instant prompt assistance
- **React Native Bridge**: Native modules for Android AICore integration

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (macOS) or **Android Emulator** or **Physical Device**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prompt-pal-app
   ```

2. **Navigate to the project**
   ```bash
   cd PromptPal
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/emulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Press `w` for Web browser
   - Or scan QR code with **Expo Go** app

## 📁 Project Structure

```
PromptPal/
├── src/
│   ├── app/                    # Expo Router pages
│   │   ├── _layout.tsx        # Root layout with navigation
│   │   ├── index.tsx          # Level select with module filtering
│   │   └── game/[id].tsx      # Dynamic game screen (adaptive per module)
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   │       ├── Button.tsx     # Custom button component
│   │       ├── Input.tsx      # Text input component
│   │       └── Modal.tsx      # Modal component
│   ├── features/
│   │   ├── game/              # Game state management
│   │   │   ├── store.ts       # Zustand store with persistence
│   │   │   ├── components/    # Game-specific components
│   │   │   │   ├── TargetImageView.tsx    # Zoomable image display
│   │   │   │   ├── PromptInputView.tsx    # Dynamic input interface
│   │   │   │   ├── ResultModal.tsx        # Universal results modal
│   │   │   │   ├── LoadingTerminal.tsx    # AI processing animation
│   │   │   │   ├── CodeRequirementsView.tsx # Programming challenges
│   │   │   │   └── CopyBriefView.tsx      # Marketing briefs
│   │   │   └── types.ts       # Game-related types
│   │   ├── levels/            # Level data and logic
│   │   │   ├── data.ts        # Level definitions and utilities
│   │   │   ├── types.ts       # Level and progress types
│   │   │   └── components/    # Level-specific components
│   │   │       └── LevelCard.tsx # Progress-aware level cards
│   │   └── onboarding/        # First-time user experience
│   │       ├── store.ts       # Onboarding state
│   │       └── OnboardingOverlay.tsx # Tutorial component
│   └── lib/
│       ├── gemini.ts          # Image generation service
│       ├── codeExecution.ts   # Code execution and testing
│       ├── copywriting.ts     # Content analysis service
│       ├── scoring.ts         # Multi-module scoring algorithms
│       ├── nano.ts            # Gemini Nano bridge (Android)
│       └── imagePreloader.ts  # Performance optimization
├── assets/                    # Static assets (icons, splash screens)
├── docs/                      # Documentation
│   ├── plan.md               # Comprehensive development plan
│   └── prd.md                # Product requirements
├── app.json                   # Expo configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json               # Dependencies and scripts
```

## 🎯 How to Play

### 🖼️ **Image Generation Module**
1. **Select a Level**: Choose from unlocked image challenges
2. **Analyze the Target**: Study the displayed image carefully (pinch to zoom)
3. **Craft Your Prompt**: Write a detailed description to recreate the image
4. **Generate & Compare**: AI creates your image and compares it to the target
5. **Improve & Retry**: Use AI feedback to refine your prompt engineering

### 💻 **Coding Module**
1. **Read Requirements**: Study the programming task and test cases
2. **Write AI Prompt**: Craft a prompt instructing AI to generate the code
3. **Execute & Test**: Generated code runs automatically against test cases
4. **Analyze Results**: Review execution results and code quality metrics
5. **Refine Prompts**: Improve your prompts based on test failures and feedback

### ✍️ **Copywriting Module**
1. **Review Brief**: Read the audience, product, and tone requirements
2. **Craft Copy Prompt**: Write a prompt for generating marketing copy
3. **Analyze Content**: AI evaluates tone, persuasion, and effectiveness
4. **Review Metrics**: Study detailed feedback on audience targeting and calls-to-action
5. **Iterate & Improve**: Refine prompts for better marketing copy generation

### Scoring System
- **Images**: 60%+ similarity score to pass (AI vision analysis)
- **Code**: 70%+ functionality score (test cases + code quality)
- **Copy**: 65%+ effectiveness score (tone + persuasion + audience fit)
- **Limited Lives**: 3 attempts per level before game over
- **Progression**: Passing unlocks next level, builds cross-module skills

## 🧪 Development Status

### ✅ Phase 1: Project Initialization & Architecture
- **Completed**: January 3, 2026
- **Duration**: 3 days
- **Deliverables**: Multi-module app foundation with adaptive UI, persistent state, module filtering

### 🚀 Phase 2: Core Service Layer (Ready to Start)
- **Timeline**: January 4-15, 2026 (8-12 hours)
- **Focus**: Real Gemini API integration across all three modules
- **Milestone**: Functional AI services for Image Generation, Code Execution, and Copywriting Analysis

### 📅 Development Roadmap

| Phase | Duration | Focus Area | Status | Time Estimate |
|-------|----------|------------|---------|---------------|
| 1 | Jan 1-3 | Multi-Module Architecture & UI | ✅ Complete | 3 days |
| 2 | Jan 4-15 | AI Services & Scoring Systems | 🚀 Ready | 8-12 hours |
| 3 | Jan 16-25 | Level Design & Persistence | 📋 Planned | 6-10 hours |
| 4 | Jan 26-Feb 8 | Gameplay Implementation | 📋 Planned | 10-14 hours |
| 5 | Feb 9-22 | Polish, Testing & Deployment | 📋 Planned | 8-12 hours |

**Total Development Time**: 50-70 hours across all phases
**Target Launch**: January 31st, 2026 (Phase 5 completion)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push and create a Pull Request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React Native best practices
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Required for all commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI**: For Gemini 1.5 Pro, Imagen, Vision, and Nano APIs powering all AI features across image generation, code analysis, and copywriting evaluation
- **Expo Team**: For the incredible React Native development platform enabling cross-platform deployment
- **React Native Community**: For the amazing ecosystem of libraries and the gesture handler, reanimated, and secure store integrations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/username/promptpal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/promptpal/discussions)
- **Email**: support@promptpal.game

---
