# 🔄 Phase 4: Level Design & Content Creation - IN PROGRESS

**Status:** 🔄 **IN PROGRESS** - 60% Complete (January 30, 2026)

**Objective:** Create comprehensive game content including levels for all three modules with proper difficulty progression.

**Estimated Time:** 8-10 hours (Actual: ~6 hours spent, ~4 hours remaining)

**Prerequisites:**
- Phase 3 complete with scoring systems
- Understanding of game design and educational content
- Image assets for target images

## Overview

Phase 4 focuses on content creation for all three modules. We need to design and implement 15 total levels (5 per module) across three difficulty tiers: Beginner, Intermediate, and Advanced.

## Current Status

### ✅ Completed (9 of 15 levels)

#### Image Generation Levels (3 of 5)
- ✅ `image-beginner-001` - "Sunset Serenity" - Basic landscape
- ✅ `image-beginner-002` - "Mountain Vista" - Nature scene
- ✅ `image-beginner-003` - "City Lights" - Urban night scene

**Missing:** 2 Intermediate + 1 Advanced

#### Code Generation Levels (3 of 5)
- ✅ `code-beginner-001` - "Simple Calculator" - Basic arithmetic
- ✅ `code-beginner-002` - "Text Reverser" - String manipulation
- ✅ `code-beginner-003` - "Array Sum" - Array operations

**Missing:** 2 Intermediate + 1 Advanced

#### Copywriting Levels (3 of 5)
- ✅ `copy-beginner-001` - "Coffee Shop Welcome" - Headline writing
- ✅ `copy-beginner-002` - "Fitness App Description" - Product description
- ✅ `copy-beginner-003` - "Tech Gadget Ad" - Advertisement copy

**Missing:** 2 Intermediate + 1 Advanced

## Level Structure

Each level includes:
- **ID**: Unique identifier (e.g., `image-beginner-001`)
- **Title**: Descriptive name
- **Module**: image | code | copy
- **Difficulty**: beginner | intermediate | advanced
- **Description**: Challenge description
- **Prerequisites**: Array of level IDs required to unlock
- **Target Content**: Module-specific (image URL, code requirements, copy brief)
- **Hidden Keywords**: For image scoring
- **Test Cases**: For code validation
- **Requirements**: For copy evaluation
- **Passing Score**: Minimum score to complete (60-80%)
- **XP Reward**: Experience points earned
- **Hints**: Array of hint strings
- **Time Limit**: Optional time constraint
- **Max Attempts**: Allowed retry attempts

## Level Data Implementation

**File:** `src/features/levels/data.ts`

```typescript
export interface LevelConfig {
  id: string;
  title: string;
  module: 'image' | 'code' | 'copy';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  prerequisites: string[];
  
  // Image module
  targetImageUrl?: string;
  hiddenKeywords?: string[];
  
  // Code module
  codeRequirements?: string;
  testCases?: TestCase[];
  language?: 'javascript' | 'python' | 'typescript';
  
  // Copy module
  copyBrief?: string;
  targetTone?: string;
  wordLimit?: number;
  requiredElements?: string[];
  
  // Common
  passingScore: number;
  xpReward: number;
  hints: string[];
  timeLimit?: number;
  maxAttempts: number;
}
```

## Remaining Work

### 4.1: Intermediate Levels (6 levels)

**Image Generation (2 levels):**
- `image-intermediate-001` - Complex scene with multiple subjects
- `image-intermediate-002` - Specific artistic style challenge

**Code Generation (2 levels):**
- `code-intermediate-001` - Function with multiple test cases
- `code-intermediate-002` - Algorithm implementation

**Copywriting (2 levels):**
- `copy-intermediate-001` - Email marketing campaign
- `copy-intermediate-002` - Social media campaign

### 4.2: Advanced Levels (3 levels)

**Image Generation (1 level):**
- `image-advanced-001` - Abstract concept visualization

**Code Generation (1 level):**
- `code-advanced-001` - Complex algorithm with edge cases

**Copywriting (1 level):**
- `copy-advanced-001` - Full marketing campaign with multiple pieces

### 4.3: Level Prerequisites

**Current unlocking logic:**
- Beginner levels: Always unlocked
- Intermediate levels: Require 2 completed beginner levels in same module
- Advanced levels: Require all intermediate levels in same module

**Implementation:** `src/features/levels/data.ts` - `getUnlockedLevels()` function

## Level Selection UI

**Current Implementation:**
- ✅ Basic level list in `src/app/(tabs)/level-select.tsx`
- ✅ Module filtering (Image, Code, Copy)
- ✅ Difficulty indicators
- ✅ Lock/unlock status display
- ✅ Completion status with checkmarks

**Missing Components:**
- ❌ `LevelCard` component - Individual level display
- ❌ `LevelGrid` component - 2-column grid layout
- ❌ `LevelFilters` component - Advanced filtering UI
- ❌ Progress indicators per module
- ❌ XP and reward display

## Key Achievements

- ✅ 9 levels created and functional (3 per module)
- ✅ Level data structure implemented
- ✅ Prerequisite system working
- ✅ Unlock logic implemented
- ✅ Basic level selection UI functional
- ✅ Level images hosted and accessible
- ✅ Test cases defined for code levels
- ✅ Copy briefs written for copy levels

## Known Issues

1. **Level Images**: Some placeholder images still in use
2. **Intermediate/Advanced**: No content created yet
3. **UI Polish**: Level selection UI needs visual enhancement
4. **Progress Tracking**: Per-level progress not fully implemented

## Next Steps

1. Create 6 intermediate levels (2 per module)
2. Create 3 advanced levels (1 per module)
3. Design and implement `LevelCard` component
4. Design and implement `LevelGrid` component
5. Add progress tracking per level
6. Enhance level selection UI with animations

## Phase 4 Completion Checklist

- [x] Level data structure defined
- [x] 9 beginner levels created (3 per module)
- [x] Level prerequisites system implemented
- [x] Unlock logic working
- [x] Basic level selection UI functional
- [ ] 6 intermediate levels created (2 per module) - IN PROGRESS
- [ ] 3 advanced levels created (1 per module) - PENDING
- [ ] LevelCard component implemented - PENDING
- [ ] LevelGrid component implemented - PENDING
- [ ] Advanced filtering UI - PENDING
- [ ] Per-level progress tracking - PENDING

**Completion:** 60% (9 of 15 levels created)

**Next Phase:** Phase 5 - Gameplay UI Components
