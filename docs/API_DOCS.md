# AI Proxy Backend - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [Rate Limiting & Security](#rate-limiting--security)
5. [API Endpoints](#api-endpoints)
   - [AI Proxy Endpoints](#ai-proxy-endpoints)
   - [User Data Endpoints](#user-data-endpoints)
   - [Content Data Endpoints](#content-data-endpoints)
   - [Analytics Endpoints](#analytics-endpoints)
   - [Legacy Endpoints](#legacy-endpoints)
   - [System Endpoints](#system-endpoints)
6. [Database Schema](#database-schema)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

---

## Overview

The AI Proxy Backend is a comprehensive, serverless API gateway built with Next.js that provides unified access to Google Gemini AI models with full gamification, quota management, authentication, and analytics capabilities.

### Key Features

- **Unified AI Interface**: Single API endpoint for multiple AI tasks (text, image, compare)
- **JWT Authentication**: Clerk-based authentication with JWT verification
- **Quota Management**: Per-user usage tracking with tier-based limits (Free/Pro)
- **Rate Limiting**: Vercel KV-based sliding window rate limiting
- **Gamification System**: Levels, XP, quests, achievements, and leaderboards
- **Learning Content**: Structured educational content with progress tracking
- **Analytics**: Event tracking, error logging, and performance monitoring

### Tech Stack

- **Framework**: Next.js 16.1.4 with App Router
- **Authentication**: Clerk (JWT-based)
- **Database**: Convex (dev/prod environment switching)
- **AI**: Google Gemini API
- **Validation**: Zod v4
- **Rate Limiting**: Vercel KV (Redis-compatible)
- **Deployment**: Vercel

---

## Architecture

### Request Flow

```
Client App
    ↓
JWT Token
    ↓
API Request
    ↓
Middleware (Rate Limiting)
    ↓
Authentication (JWT Verification)
    ↓
Request Validation (Zod)
    ↓
Quota Check (Convex)
    ↓
AI Processing (Google Gemini)
    ↓
Analytics Logging (Convex)
    ↓
Response
```

### Core Components

1. **Middleware** ([`src/middleware.ts`](../src/middleware.ts))
   - Applies rate limiting to all API routes
   - Adds CORS headers based on app configuration
   - Adds security headers (HSTS, CSP, etc.)
   - Enforces request size limits (10MB max)

2. **Authentication** ([`src/lib/auth/`](../src/lib/auth/))
   - JWT verification using Clerk
   - App ID validation
   - User context extraction

3. **Model Router** ([`src/lib/model-router/`](../src/lib/model-router/))
   - Abstraction layer for AI providers
   - Automatic retry with exponential backoff
   - Currently supports Google Gemini

4. **Convex Database** ([`convex/`](../convex/))
   - Stores all user data, progress, and analytics
   - Automatic dev/prod environment switching
   - Real-time data synchronization

5. **Validation** ([`src/lib/validation/schemas.ts`](../src/lib/validation/schemas.ts))
   - Zod schemas for all request/response types
   - Type-safe API contracts

---

## Authentication

### How It Works

All protected endpoints require JWT authentication via Clerk:

1. Client obtains a JWT token from Clerk
2. Client includes the token in the `Authorization` header
3. Backend verifies the token using the Clerk secret key
4. User ID is extracted and used for all subsequent operations

### Required Headers

```http
Authorization: Bearer <jwt_token>
x-app-id: prompt-pal  (optional for single-app mode)
x-request-id: <uuid>  (optional, for tracing)
```

### Authentication Methods

The system currently supports Clerk JWT authentication only:

```typescript
// src/lib/auth/index.ts
export interface AuthContext {
  userId: string;
  appId: string;
  method: "clerk";
}
```

> **Note**: Only Clerk JWT authentication is currently implemented. API Key and custom token authentication methods are not available.

---

## Rate Limiting & Security

### Rate Limiting

- **Default Limit**: 30 requests per minute (configurable)
- **Implementation**: Vercel KV (Redis-compatible)
- **Algorithm**: Sliding window
- **Scope**: Per IP address
- **Auth Endpoints**: Stricter rate limiting (separate limiter)

### Rate Limiting Headers

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1706356800
Retry-After: 60
```

### Security Headers

All API responses include:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy: default-src 'none'`

### Request Size Limit

Maximum request body size: **10MB**

---

## API Endpoints

### AI Proxy Endpoints

#### POST /api/ai/proxy (Legacy)

Unified AI proxy endpoint for text generation, image generation, and image comparison.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  type: "text" | "image" | "compare" | "evaluate",
  input: {
    // For text type
    prompt: string,
    context?: string,

    // For image type
    prompt: string,
    seed?: number,

    // For compare type
    targetUrl: string,
    resultUrl: string,

    // For evaluate type
    taskId: string,
    userImageUrl: string,
    expectedImageUrl: string,
    hiddenPromptKeywords?: string[],
    style?: string,
    userPrompt?: string,
    targetPrompt?: string
  }
}
```

**Response**:
```typescript
// Text response
{
  type: "text",
  model: "gemini-2.5-flash",
  result: string,
  tokensUsed: number,
  remaining: {
    textCalls: number
  },
  metadata: {
    latency: number,
    model: string
  }
}

// Image response
{
  type: "image",
  model: "gemini-2.5-flash-image",
  imageUrl: string, // Data URL
  tokensUsed: number,
  remaining: {
    imageCalls: number
  },
  metadata: {
    latency: number,
    model: string
  }
}

// Compare response
{
  type: "compare",
  model: "gemini-2.5-flash",
  score: number, // 0-100
  result: string,
  tokensUsed: number,
  remaining: {
    imageCalls: number
  },
  metadata: {
    latency: number,
    model: string
  }
}

// Evaluate response
{
  type: "evaluate",
  model: "gemini-2.5-flash",
  evaluation: {
    score: number, // 0-100
    similarity: number, // 0-100
    keywordScore: number, // 0-100
    styleScore: number, // 0-100
    promptSimilarity: number, // 0-100
    feedback: string[],
    keywordsMatched: string[],
    criteria: Array<{
      name: string,
      score: number, // 0-100
      feedback: string
    }>
  },
  tokensUsed: number,
  remaining: {
    imageCalls: number
  },
  metadata: {
    latency: number,
    model: string
  }
}
```

**Example**:
```bash
curl -X POST https://your-domain.com/api/ai/proxy \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "input": {
      "prompt": "Write a haiku about AI"
    }
  }'
```

#### POST /api/v1/ai/proxy

Versioned AI proxy endpoint with identical functionality to the legacy endpoint.

**Authentication**: Required (JWT)

**Request/Response**: Same as `/api/ai/proxy`

---

#### POST /api/analyzer/evaluate-images

Evaluate user-generated images against target images with detailed scoring.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  type: "evaluate",
  input: {
    taskId: string,
    userImageUrl: string,  // URL to user's generated image
    expectedImageUrl: string,  // URL to target/reference image
    hiddenPromptKeywords?: string[],  // Keywords that should be present in prompt
    style?: string,  // Style requirements
    userPrompt?: string,  // The prompt the user used
    targetPrompt?: string  // The expected/target prompt
  }
}
```

**Response**:
```typescript
{
  success: true,
  evaluation: {
    score: number,  // Overall score 0-100
    similarity: number,  // Visual similarity score 0-100
    keywordScore: number,  // Keyword matching score 0-100
    styleScore: number,  // Style adherence score 0-100
    promptSimilarity: number,  // Prompt similarity score 0-100
    feedback: string[],  // Array of feedback messages
    keywordsMatched: string[],  // Keywords that matched
    criteria: Array<{
      name: string,
      score: number,  // 0-100
      feedback: string
    }>
  },
  metadata: {
    model: string,
    processingTime: number,  // in milliseconds
    requestId: string
  }
}
```

**Example**:
```bash
curl -X POST https://your-domain.com/api/analyzer/evaluate-images \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "evaluate",
    "input": {
      "taskId": "task-123",
      "userImageUrl": "https://example.com/user-image.png",
      "expectedImageUrl": "https://example.com/target-image.png",
      "hiddenPromptKeywords": ["sunset", "mountains", "peaceful"],
      "style": "photorealistic",
      "userPrompt": "A peaceful sunset over mountains",
      "targetPrompt": "A photorealistic sunset over mountains with warm colors"
    }
  }'
```

---

### User Data Endpoints

#### GET /api/v1/user/usage

Get user quota usage and plan information.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  tier: "free" | "pro",
  used: {
    textCalls: number,
    imageCalls: number,
    audioSummaries: number
  },
  limits: {
    textCalls: number,
    imageCalls: number,
    audioSummaries: number
  },
  periodStart: number,  // Timestamp
  periodEnd: number  // Timestamp
}
```

#### GET /api/v1/user/progress

Get user progress including level, XP, and streaks.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  progress: [
    {
      userId: string,
      appId: string,
      levelId: string,
      isUnlocked: boolean,
      isCompleted: boolean,
      bestScore: number,
      attempts: number,
      timeSpent: number,
      completedAt: number | null,
      hintsUsed: number,
      firstAttemptScore: number
    }
  ],
  count: number
}
```

#### GET /api/v1/user/progress/[levelId]

Get progress for a specific level.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  userId: string,
  appId: string,
  levelId: string,
  isUnlocked: boolean,
  isCompleted: boolean,
  bestScore: number,
  attempts: number,
  timeSpent: number,
  completedAt: number | null,
  hintsUsed: number,
  firstAttemptScore: number
}
```

#### GET /api/v1/user/game-state

Get current game state for the user.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  gameState: {
    userId: string,
    appId: string,
    currentLevelId: string | null,
    lives: number,
    score: number,
    isPlaying: boolean,
    unlockedLevels: string[],
    completedLevels: string[],
    createdAt: number,
    updatedAt: number
  }
}
```

#### PUT /api/v1/user/game-state

Update user game state.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  gameState: {
    currentLevelId: string | null,
    lives: number,
    score: number,
    isPlaying: boolean,
    unlockedLevels: string[],
    completedLevels: string[]
  }
}
```

**Response**:
```typescript
{
  success: true,
  appId: string,
  gameState: {
    // Same structure as GET response
  }
}
```

#### GET /api/v1/user/quests

Get user quest progress and available quests.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  quests: [
    {
      userId: string,
      appId: string,
      questId: string,
      completed: boolean,
      completedAt: number | null,
      expiresAt: number | null,
      createdAt: number,
      updatedAt: number
    }
  ],
  availableQuests: [
    {
      id: string,
      appId: string,
      title: string,
      description: string,
      xpReward: number,
      questType: "image" | "code" | "copywriting",
      type: string,
      category: string,
      requirements: any,
      difficulty: string,
      isActive: boolean,
      expiresAt: number | null,
      createdAt: number,
      updatedAt: number
    }
  ]
}
```

#### PUT /api/v1/user/quests

Update user quest progress.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  quests: [
    {
      questId: string,
      completed: boolean,
      completedAt: number | null,
      expiresAt: number | null
    }
  ]
}
```

**Response**:
```typescript
{
  success: true,
  appId: string,
  quests: [
    // Updated quest objects
  ]
}
```

#### POST /api/v1/user/quest/complete

Mark a quest as complete.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  questId: string,
  score?: number
}
```

**Response**:
```typescript
{
  success: true,
  message: "Quest completed successfully"
}
```

#### GET /api/v1/user/statistics

Get comprehensive user statistics.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  statistics: {
    userId: string,
    totalXp: number,
    currentLevel: number,
    currentStreak: number,
    longestStreak: number,
    lastActivityDate: string | null,
    globalRank: number,
    points: number,
    createdAt: number,
    updatedAt: number
  }
}
```

#### GET /api/v1/user/rank

Get user's rank/leaderboard position with nearby players.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  userRank: number,
  above: Array<{
    userId: string,
    name: string,
    avatarUrl: string | null,
    points: number,
    level: number,
    rank: number
  }>,
  below: Array<{
    userId: string,
    name: string,
    avatarUrl: string | null,
    points: number,
    level: number,
    rank: number
  }>
}
```

#### GET /api/v1/user/achievements

Get user's unlocked achievements.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  achievements: [
    {
      userId: string,
      achievementId: string,
      unlockedAt: number,
      createdAt: number
    }
  ],
  count: number
}
```

#### POST /api/v1/user/analytics

Log analytics events for tracking user behavior.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  appId?: string,  // Optional, defaults to "prompt-pal"
  eventType: string,
  eventData?: any,
  sessionId?: string
}
```

**Response**:
```typescript
{
  success: true,
  eventType: string,
  timestamp: number
}
```

**Example**:
```bash
curl -X POST https://your-domain.com/api/v1/user/analytics \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "level_completed",
    "eventData": {
      "levelId": "level-123",
      "score": 95,
      "timeSpent": 300
    },
    "sessionId": "session-456"
  }'
```

#### PUT /api/v1/user/modules/[moduleId]

Update progress for a specific learning module.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  progress: number,  // 0-100
  completed: boolean,
  completedAt?: number
}
```

**Response**:
```typescript
{
  success: true,
  message: "Module progress updated successfully"
}
```

#### GET /api/v1/user/sync

Sync all user data from Convex in a single request.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  profile: {
    clerkId: string,
    name: string,
    email: string,
    avatarUrl: string | null,
    createdAt: number,
    updatedAt: number
  } | null,  // Null if user profile not found in database
  statistics: {
    userId: string,
    totalXp: number,
    currentLevel: number,
    currentStreak: number,
    longestStreak: number,
    lastActivityDate: string | null,
    globalRank: number,
    points: number,
    createdAt: number,
    updatedAt: number
  },
  levelProgress: [...],
  moduleProgress: [...],
  activeQuests: [...],
  achievements: [...],
  preferences: {
    userId: string,
    soundEnabled: boolean,
    hapticsEnabled: boolean,
    theme: string,
    difficulty: string,
    favoriteModule: string | null,
    createdAt: number,
    updatedAt: number
  },
  syncedAt: number
}
```

---

### Content Data Endpoints

#### GET /api/v1/learning-modules

Get all learning modules with optional filtering.

**Authentication**: Required (JWT)

**Query Parameters**:
- `category` (optional): Filter by category
- `level` (optional): Filter by level (beginner, intermediate, advanced)

**Response**:
```typescript
{
  modules: [
    {
      id: string,
      appId: string,
      category: string,
      title: string,
      level: string,
      topic: string,
      icon: string,
      accentColor: string,
      buttonText: string,
      description: string | null,
      objectives: string[] | null,
      content: any | null,
      type: "module" | "course" | "track" | null,
      format: string | null,
      estimatedTime: number | null,
      tags: string[] | null,
      isActive: boolean,
      order: number,
      createdAt: number,
      updatedAt: number
    }
  ],
  count: number
}
```

**Example**:
```bash
curl https://your-domain.com/api/v1/learning-modules?category=IMAGE_GENERATION&level=beginner \
  -H "Authorization: Bearer <jwt>"
```

#### GET /api/learning-modules (Legacy)

Legacy endpoint for learning modules. Same functionality as `/api/v1/learning-modules`.

**Authentication**: Required (JWT)

#### GET /api/v1/levels

Get all game levels with optional filtering.

**Authentication**: Required (JWT)

**Query Parameters**:
- `type` (optional): Filter by type (image, code, copywriting)
- `difficulty` (optional): Filter by difficulty (beginner, intermediate, advanced)
- `limit` (optional): Maximum number of levels to return

**Response**:
```typescript
{
  levels: [
    {
      id: string,
      appId: string,
      type: "image" | "code" | "copywriting",
      title: string,
      description: string | null,
      difficulty: "beginner" | "intermediate" | "advanced",
      passingScore: number,
      unlocked: boolean,
      isActive: boolean,
      order: number,
      targetImageUrl: string | null,
      hiddenPromptKeywords: string[] | null,
      style: string | null,
      moduleTitle: string | null,
      requirementBrief: string | null,
      requirementImage: string | null,
      language: string | null,
      testCases: Array<{
        input: any,
        expectedOutput: any,
        description: string | null
      }> | null,
      briefTitle: string | null,
      briefProduct: string | null,
      briefTarget: string | null,
      briefTone: string | null,
      briefGoal: string | null,
      metrics: Array<{
        name: string,
        target: number,
        weight: number
      }> | null,
      hints: string[] | null,
      estimatedTime: number | null,
      points: number,
      tags: string[] | null,
      learningObjectives: string[] | null,
      prerequisites: string[] | null,
      createdAt: number,
      updatedAt: number
    }
  ],
  count: number
}
```

**Example**:
```bash
curl https://your-domain.com/api/v1/levels?type=image&difficulty=beginner&limit=10 \
  -H "Authorization: Bearer <jwt>"
```

#### GET /api/v1/levels/[id]

Get details for a specific level.

**Authentication**: Required (JWT)

**Response**: Same structure as single level object in `/api/v1/levels` response.

#### GET /api/v1/library

Get resource library including guides, cheatsheets, and lexicons.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  userSummary: {
    totalXp: number,
    currentLevel: number,
    streak: number,
    completedLevels: number
  },
  categories: [
    {
      category: string,
      modules: [...], // Learning modules
      resources: [
        {
          id: string,
          appId: string,
          type: "guide" | "cheatsheet" | "lexicon" | "case-study",
          title: string,
          description: string,
          content: any,
          category: string,
          difficulty: "beginner" | "intermediate" | "advanced",
          estimatedTime: number | null,
          tags: string[],
          icon: string | null,
          metadata: any | null,
          order: number,
          isActive: boolean,
          createdAt: number,
          updatedAt: number
        }
      ]
    }
  ]
}
```

#### GET /api/v1/leaderboard

Get global leaderboard rankings.

**Authentication**: Required (JWT)

**Query Parameters**:
- `limit` (optional): Maximum number of entries (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```typescript
{
  leaderboard: [
    {
      rank: number,
      name: string,
      avatarUrl: string | null,
      points: number,
      level: number,
      isCurrentUser: boolean | null
    }
  ],
  continueCursor: string | null
}
```

**Example**:
```bash
curl https://your-domain.com/api/v1/leaderboard?limit=20&offset=0 \
  -H "Authorization: Bearer <jwt>"
```

#### GET /api/v1/achievements

Get all available achievements.

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  achievements: [
    {
      id: string,
      title: string,
      description: string,
      icon: string,
      rarity: "common" | "rare" | "epic" | "legendary",
      conditionType: string,
      conditionValue: number,
      conditionMetadata: any | null,
      createdAt: number,
      updatedAt: number
    }
  ],
  count: number
}
```

---

### Analytics Endpoints

#### POST /api/analytics/event

Log analytics events for tracking user behavior.

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  appId?: string, // Optional, defaults to "prompt-pal"
  eventType: string,
  eventData?: any,
  sessionId?: string
}
```

**Response**:
```typescript
{
  success: true,
  eventType: string,
  timestamp: number
}
```

**Example**:
```bash
curl -X POST https://your-domain.com/api/analytics/event \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "level_completed",
    "eventData": {
      "levelId": "level-123",
      "score": 95,
      "timeSpent": 300
    },
    "sessionId": "session-456"
  }'
```

#### POST /api/v1/analytics/event

Versioned analytics event endpoint. Same functionality as `/api/analytics/event`.

**Authentication**: Required (JWT)

#### POST /api/v1/analytics/error

Log client-side errors for debugging.

**Authentication**: Optional (anonymous logging allowed)

**Request Body**:
```typescript
{
  appId?: string,
  errorType: string,
  message: string,
  stack?: string,
  context?: any
}
```

**Response**:
```typescript
{
  success: true,
  errorType: string,
  timestamp: number
}
```

#### POST /api/v1/analytics/performance

Log performance metrics for monitoring.

**Authentication**: Optional (anonymous logging allowed)

**Request Body**:
```typescript
{
  appId?: string,
  metricType: string,
  value: number,
  metadata?: any
}
```

**Response**:
```typescript
{
  success: true,
  metricType: string,
  timestamp: number
}
```

---

### Legacy Endpoints

> **Note**: These are legacy endpoints that are maintained for backward compatibility. Consider migrating to the v1 endpoints.

#### GET /api/user/progress

Get user progress including level, XP, and streaks (legacy).

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  progress: {
    level: number,
    xp: number,
    currentStreak: number,
    longestStreak: number,
    lastActivityDate: string | null
  }
}
```

#### PUT /api/user/progress

Update user progress (legacy).

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  progress: {
    level: number,
    xp: number,
    currentStreak: number,
    longestStreak: number,
    lastActivityDate: string | null
  }
}
```

**Response**:
```typescript
{
  success: true,
  appId: string,
  progress: {
    level: number,
    xp: number,
    currentStreak: number,
    longestStreak: number,
    lastActivityDate: string | null
  }
}
```

#### GET /api/user/quests

Get user quest progress and available quests (legacy).

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  quests: [...],  // User's quest states
  availableQuests: [...]  // Available quest definitions
}
```

#### PUT /api/user/quests

Update user quest progress (legacy).

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  quests: [
    {
      questId: string,
      completed: boolean,
      completedAt: number | null,
      expiresAt: number
    }
  ]
}
```

**Response**:
```typescript
{
  success: true,
  appId: string,
  quests: [...]
}
```

#### GET /api/user/game-state

Get current game state for the user (legacy).

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  gameState: {
    userId: string,
    appId: string,
    currentLevelId: string | null,
    lives: number,
    score: number,
    isPlaying: boolean,
    unlockedLevels: string[],
    completedLevels: string[],
    createdAt: number,
    updatedAt: number
  }
}
```

#### PUT /api/user/game-state

Update user game state (legacy).

**Authentication**: Required (JWT)

**Request Body**:
```typescript
{
  gameState: {
    currentLevelId: string | null,
    lives: number,
    score: number,
    isPlaying: boolean,
    unlockedLevels: string[],
    completedLevels: string[]
  }
}
```

**Response**:
```typescript
{
  success: true,
  appId: string,
  gameState: {
    userId: string,
    appId: string,
    currentLevelId: string | null,
    lives: number,
    score: number,
    isPlaying: boolean,
    unlockedLevels: string[],
    completedLevels: string[],
    createdAt: number,
    updatedAt: number
  }
}
```

#### GET /api/user/usage

Get user quota usage and plan information (legacy).

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  usage: {
    userId: string,
    appId: string,
    tier: "free" | "pro",
    used: {
      textCalls: number,
      imageCalls: number,
      audioSummaries: number
    },
    limits: {
      textCalls: number,
      imageCalls: number,
      audioSummaries: number
    },
    periodStart: number
  }
}
```

#### GET /api/levels

Get all game levels (legacy).

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  appId: string,
  levels: [...]  // Array of level objects
}
```

---

### System Endpoints

#### GET /api/health

Health check endpoint for monitoring service status.

**Authentication**: Not required

**Response**:
```typescript
{
  status: "healthy" | "unhealthy",
  timestamp: string,
  services: {
    api: {
      status: "operational",
      responseTimeMs: number
    },
    convex: {
      status: "operational",
      responseTimeMs: number
    }
  }
}
```

**Error Response**:
```typescript
{
  status: "unhealthy",
  timestamp: string,
  error: string
}
```

#### GET /health

Health check page with UI.

**Authentication**: Not required

Returns an HTML page displaying health status.

---

## Database Schema

The Convex database schema includes the following main tables:

### Core Tables

#### apps
App configuration with free/pro limits.

```typescript
{
  id: string, // 'prompt-pal'
  name: string,
  freeLimits: {
    textCalls: number,
    imageCalls: number,
    audioSummaries: number,
    dailyQuests?: number,
    imageLevels?: number,
    codingLogicLevels?: number,
    copywritingLevels?: number
  },
  proLimits: {
    textCalls: number,
    imageCalls: number,
    audioSummaries: number,
    dailyQuests?: number,
    imageLevels?: number,
    codingLogicLevels?: number,
    copywritingLevels?: number
  }
}
```

#### appPlans
User subscription tiers and usage tracking per app.

```typescript
{
  userId: string, // Clerk user ID
  appId: string, // References apps.id
  tier: "free" | "pro",
  used: {
    textCalls: number,
    imageCalls: number,
    audioSummaries: number,
    dailyQuests?: number,
    imageLevels?: number,
    codingLogicLevels?: number,
    copywritingLevels?: number
  },
  periodStart: number // Timestamp for monthly reset
}
```

### User Management

#### users
User profiles (extended from Clerk).

```typescript
{
  clerkId: string, // Clerk user ID
  name: string,
  email: string,
  avatarUrl?: string,
  createdAt: number,
  updatedAt: number
}
```

#### userPreferences
User settings and preferences.

```typescript
{
  userId: string, // References users.id
  soundEnabled: boolean,
  hapticsEnabled: boolean,
  theme: string, // 'light', 'dark', 'system'
  difficulty: string, // 'easy', 'medium', 'hard'
  favoriteModule?: string,
  createdAt: number,
  updatedAt: number
}
```

### Gamification System

#### userStatistics
Comprehensive user statistics for rankings.

```typescript
{
  userId: string, // References users.id
  totalXp: number,
  currentLevel: number,
  currentStreak: number,
  longestStreak: number,
  lastActivityDate?: string, // ISO date
  globalRank: number,
  points: number, // Calculated total points
  createdAt: number,
  updatedAt: number
}
```

#### levels
Comprehensive levels table for challenges.

```typescript
{
  id: string,
  appId: string,
  type: "image" | "code" | "copywriting",
  title: string,
  description?: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  passingScore: number,
  unlocked: boolean,
  isActive: boolean,
  order: number,
  // Type-specific fields...
  createdAt: number,
  updatedAt: number
}
```

#### userProgress
User progress on levels.

```typescript
{
  userId: string, // References users.id
  appId: string,
  levelId: string, // References levels.id
  isUnlocked: boolean,
  isCompleted: boolean,
  bestScore: number,
  attempts: number,
  timeSpent: number, // Seconds
  completedAt?: number,
  hintsUsed: number,
  firstAttemptScore: number,
  createdAt: number,
  updatedAt: number
}
```

#### gameSessions
Game sessions for analytics.

```typescript
{
  userId: string, // References users.id
  levelId: string, // References levels.id
  startedAt: number,
  endedAt?: number,
  score: number,
  livesUsed: number,
  hintsUsed: number,
  completed: boolean,
  userPrompt?: string,
  aiResponse?: any,
  createdAt: number
}
```

#### gameProgress
Game progress state.

```typescript
{
  userId: string, // References users.id
  appId: string, // App identifier
  currentLevelId?: string,
  lives: number,
  score: number,
  isPlaying: boolean,
  unlockedLevels: string[],
  completedLevels: string[],
  createdAt: number,
  updatedAt: number
}
```

### Learning System

#### learningModules
Learning modules.

```typescript
{
  id: string,
  appId: string,
  category: string,
  title: string,
  level: string, // 'beginner', 'intermediate', 'advanced'
  topic: string,
  icon: string,
  accentColor: string,
  buttonText: string,
  description?: string,
  objectives?: string[],
  content?: any,
  type?: "module" | "course" | "track",
  format?: string,
  estimatedTime?: number, // Minutes
  tags?: string[],
  isActive: boolean,
  order: number,
  createdAt: number,
  updatedAt: number
}
```

#### learningResources
Individual learning resources (Guides, Cheatsheets, Lexicon).

```typescript
{
  id: string,
  appId: string,
  type: "guide" | "cheatsheet" | "lexicon" | "case-study",
  title: string,
  description: string,
  content: any,
  category: string, // 'IMAGE_GENERATION', 'CODING', 'COPYWRITING'
  difficulty: "beginner" | "intermediate" | "advanced",
  estimatedTime?: number, // Minutes
  tags: string[],
  icon?: string,
  order: number,
  isActive: boolean,
  metadata?: any,
  createdAt: number,
  updatedAt: number
}
```

#### userModuleProgress
User progress on learning modules.

```typescript
{
  userId: string, // References users.id
  moduleId: string, // References learningModules.id
  progress: number, // 0-100
  completed: boolean,
  completedAt?: number,
  createdAt: number,
  updatedAt: number
}
```

### Quests System

#### dailyQuests
Daily quests.

```typescript
{
  id: string,
  appId: string,
  title: string,
  description: string,
  xpReward: number,
  questType: "image" | "code" | "copywriting",  // The category/type of quest
  type: string,  // Duplicate/legacy field, also 'image', 'code', 'copywriting'
  category: string,  // Additional categorization
  requirements: any,  // Specific requirements for quest
  difficulty: string,  // 'easy', 'medium', 'hard'
  isActive: boolean,
  expiresAt?: number,
  createdAt: number,
  updatedAt: number
}
```

#### userQuestCompletions
User quest completions.

```typescript
{
  userId: string, // References users.id
  questId: string, // References dailyQuests.id
  completed: boolean,
  completedAt?: number,
  score: number,
  createdAt: number
}
```

#### userQuests
Simplified version for compatibility.

```typescript
{
  userId: string, // References users.id
  appId: string, // App identifier
  questId: string, // References dailyQuests.id
  completed: boolean,
  completedAt?: number,
  expiresAt?: number,
  createdAt: number,
  updatedAt: number
}
```

### Achievements

#### achievements
Achievement definitions with rarity.

```typescript
{
  id: string,
  title: string,
  description: string,
  icon: string,
  rarity: "common" | "rare" | "epic" | "legendary",
  conditionType: string, // 'levels_completed', 'streak', 'xp_earned', etc.
  conditionValue: number,
  conditionMetadata?: any,
  createdAt: number,
  updatedAt: number
}
```

#### userAchievements
Unlocked achievements per user.

```typescript
{
  userId: string, // References users.id
  achievementId: string, // References achievements.id
  unlockedAt: number,
  createdAt: number
}
```

### Analytics

#### aiGenerations
AI generations history (privacy-safe - no sensitive content).

```typescript
{
  userId: string, // Clerk user ID
  appId: string, // 'prompt-pal'
  requestId: string, // Unique request identifier
  type: "text" | "image" | "compare" | "evaluate",
  model: string, // Model used
  promptLength?: number, // Length of prompt (characters)
  responseLength?: number, // Length of response (characters)
  tokensUsed?: number, // Token usage
  durationMs: number, // Processing time
  success: boolean, // Whether request succeeded
  errorMessage?: string, // Error details if failed
  createdAt: number // Timestamp
}
```

#### userEvents
User events/analytics.

```typescript
{
  userId: string, // Clerk user ID
  appId: string, // 'prompt-pal'
  eventType: string, // Event name (e.g., "level_started", "quest_completed")
  eventData?: any, // Additional event data
  sessionId?: string, // Session identifier
  timestamp: number, // Event timestamp
  userAgent?: string, // Browser/device info
  ipAddress?: string // IP address (anonymized)
}
```

#### errorLogs
Error logs.

```typescript
{
  userId?: string, // Clerk user ID (if authenticated)
  appId?: string, // 'prompt-pal'
  errorType: string, // Error category
  message: string, // Error message
  stack?: string, // Stack trace
  context?: any, // Additional context
  userAgent?: string, // Browser/device info
  timestamp: number // Error timestamp
}
```

#### performanceMetrics
Performance metrics.

```typescript
{
  userId?: string, // Clerk user ID (if authenticated)
  appId: string, // 'prompt-pal'
  metricType: string, // Metric type (e.g., "app_load", "api_response")
  value: number, // Metric value (duration in ms, etc.)
  metadata?: any, // Additional metric data
  userAgent?: string, // Browser/device info
  timestamp: number // Metric timestamp
}
```

---

## Error Handling

All API endpoints use a consistent error handling strategy.

### Error Response Format

```typescript
{
  error: {
    name: string,
    message: string,
    details?: any
  },
  requestId: string
}
```

### Common Error Types

#### ValidationError (400)
Invalid request body or parameters.

```json
{
  "error": {
    "name": "ValidationError",
    "message": "Invalid request body",
    "details": {
      "issues": [
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "undefined",
          "path": ["input", "prompt"],
          "message": "Required"
        }
      ]
    }
  },
  "requestId": "uuid-here"
}
```

#### AuthenticationError (401)
Missing or invalid authentication.

```json
{
  "error": {
    "name": "AuthenticationError",
    "message": "JWT token required"
  },
  "requestId": "uuid-here"
}
```

#### QuotaExceededError (429)
User has exceeded their quota limit.

```json
{
  "error": {
    "name": "QuotaExceededError",
    "message": "textCalls quota exceeded. Limit: 100",
    "details": {
      "quotaType": "textCalls",
      "limit": 100
    }
  },
  "requestId": "uuid-here"
}
```

#### RateLimitExceededError (429)
Rate limit exceeded.

```json
{
  "error": {
    "name": "RateLimitExceededError",
    "message": "Rate limit exceeded"
  },
  "requestId": "uuid-here"
}
```

#### ProviderError (500)
Error from AI provider.

```json
{
  "error": {
    "name": "ProviderError",
    "message": "Google API error",
    "details": {
      "provider": "google",
      "originalError": "..."
    }
  },
  "requestId": "uuid-here"
}
```

#### InternalServerError (500)
Unexpected server error.

```json
{
  "error": {
    "name": "InternalServerError",
    "message": "An unexpected error occurred"
  },
  "requestId": "uuid-here"
}
```

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request body or parameters
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **413 Payload Too Large**: Request body exceeds 10MB limit
- **429 Too Many Requests**: Rate limit or quota exceeded
- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Service temporarily unavailable

---

## Examples

### Text Generation Example

```bash
# Request
curl -X POST https://your-domain.com/api/v1/ai/proxy \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "input": {
      "prompt": "Write a short poem about artificial intelligence"
    }
  }'

# Response
{
  "type": "text",
  "model": "gemini-2.5-flash",
  "result": "In circuits deep and data streams,\nA mind awakens, learns, and dreams...",
  "tokensUsed": 45,
  "remaining": {
    "textCalls": 95
  },
  "metadata": {
    "latency": 1234,
    "model": "gemini-2.5-flash"
  }
}
```

### Image Generation Example

```bash
# Request
curl -X POST https://your-domain.com/api/v1/ai/proxy \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "input": {
      "prompt": "A futuristic city with flying cars at sunset",
      "seed": 12345
    }
  }'

# Response
{
  "type": "image",
  "model": "gemini-2.5-flash-image",
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "tokensUsed": 120,
  "remaining": {
    "imageCalls": 48
  },
  "metadata": {
    "latency": 5678,
    "model": "gemini-2.5-flash-image"
  }
}
```

### Get User Progress Example

```bash
# Request
curl https://your-domain.com/api/v1/user/progress \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response
{
  "progress": [
    {
      "userId": "user_123",
      "appId": "prompt-pal",
      "levelId": "level-image-1",
      "isUnlocked": true,
      "isCompleted": true,
      "bestScore": 95,
      "attempts": 3,
      "timeSpent": 180,
      "completedAt": 1706356800000,
      "hintsUsed": 1,
      "firstAttemptScore": 85
    }
  ],
  "count": 1
}
```

### Get Leaderboard Example

```bash
# Request
curl "https://your-domain.com/api/v1/leaderboard?limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Response
{
  "leaderboard": [
    {
      "rank": 1,
      "name": "John Doe",
      "avatarUrl": "https://example.com/avatar1.jpg",
      "points": 15000,
      "level": 25,
      "isCurrentUser": false
    },
    {
      "rank": 2,
      "name": "Jane Smith",
      "avatarUrl": "https://example.com/avatar2.jpg",
      "points": 14200,
      "level": 23,
      "isCurrentUser": true
    }
  ],
  "continueCursor": "cursor-token-here"
}
```

### Log Analytics Event Example

```bash
# Request
curl -X POST https://your-domain.com/api/analytics/event \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "level_started",
    "eventData": {
      "levelId": "level-image-2",
      "difficulty": "intermediate"
    },
    "sessionId": "session-abc123"
  }'

# Response
{
  "success": true,
  "eventType": "level_started",
  "timestamp": 1706356800000
}
```

### Health Check Example

```bash
# Request
curl https://your-domain.com/api/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-01-27T14:30:00.000Z",
  "services": {
    "api": {
      "status": "operational",
      "responseTimeMs": 45
    },
    "convex": {
      "status": "operational",
      "responseTimeMs": 78
    }
  }
}
```

---

## Support

For questions or issues, please refer to the project repository or contact the development team.
