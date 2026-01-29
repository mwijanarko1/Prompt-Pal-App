# Scoring Services & Backend Integration

This directory contains the core scoring services and backend synchronization utilities for the Prompt Pal application.

## Overview

The scoring services provide AI-powered evaluation for different challenge types:
- **ImageScoringService**: Evaluates image generation against target images
- **CodeScoringService**: Validates and scores code submissions
- **CopyScoringService**: Analyzes copywriting quality and effectiveness

The sync manager handles offline support and conflict resolution for user progress.

## ImageScoringService

### Usage

```typescript
import { ImageScoringService } from '@/lib/scoring';

const result = await ImageScoringService.scoreImage({
  targetImageUrl: 'https://example.com/target.jpg',
  resultImageUrl: 'https://example.com/result.jpg',
  hiddenPromptKeywords: ['mountain', 'sunset', 'lake'],
  style: 'Surrealism',
  passingScore: 75,
});

console.log(result.score); // 0-100
console.log(result.similarity); // 0-100%
console.log(result.feedback); // Array of suggestions
console.log(result.keywordsMatched); // Array of captured keywords
```

### Features

- **AI-powered similarity comparison** using `AIProxyClient.compareImages()`
- **Keyword matching** to detect hidden prompt elements
- **Style analysis** for artistic style matching
- **Fallback scoring** when AI comparison fails
- **Timeout protection** (45 seconds)
- **Batch processing** support

### Edge Case Handling

- Invalid URLs
- Network failures
- Timeout scenarios
- Missing or corrupted responses

## CodeScoringService

### Usage

```typescript
import { CodeScoringService } from '@/lib/scoring';

const result = await CodeScoringService.scoreCode({
  code: 'def sort_by_age(data):\n    return sorted(data, key=lambda x: x["age"], reverse=True)',
  language: 'PYTHON 3.10',
  functionName: 'sort_by_age',
  testCases: [
    {
      id: '1',
      name: 'test_sorting_basic',
      input: [{'name': 'Alice', 'age': 30}, {'name': 'Bob', 'age': 25}],
      expectedOutput: [{'name': 'Alice', 'age': 30}, {'name': 'Bob', 'age': 25}],
    },
  ],
  passingScore: 80,
});

console.log(result.score); // 0-100
console.log(result.testResults); // Array of test results
console.log(result.syntaxValid); // Boolean
console.log(result.feedback); // Array of suggestions
```

### Features

- **Syntax validation** for Python and JavaScript
- **Backend code execution** via API
- **Sandboxed fallback** when backend fails
- **Test case tracking** with pass/fail status
- **Execution time analysis** for efficiency scoring
- **Detailed error reporting**

### Supported Languages

- Python 3.10
- JavaScript (ES6+)

## CopyScoringService

### Usage

```typescript
import { CopyScoringService } from '@/lib/scoring';

const result = await CopyScoringService.scoreCopy({
  text: 'Experience the future of coffee with Neo-Coffee Social...',
  briefProduct: 'Neo-Coffee Social',
  briefTarget: 'Gen Z Urbanites',
  briefTone: 'Bold & Energetic',
  briefGoal: 'Drive subscriptions for sustainable coffee pods',
  wordLimit: { min: 20, max: 300 },
  requiredElements: ['CTA', 'brand mention'],
  passingScore: 85,
});

console.log(result.score); // 0-100
console.log(result.metrics); // Radar chart compatible metrics
console.log(result.wordCount); // Actual word count
console.log(result.withinLimit); // Boolean
console.log(result.feedback); // Array of suggestions
```

### Features

- **AI-powered analysis** of tone, persuasion, clarity, etc.
- **Radar chart metrics** for visualization:
  - TONE
  - PERSUASION
  - CLARITY
  - AUDIENCE FIT
  - CREATIVITY
  - ENGAGEMENT
- **Word count validation**
- **Required element checking**
- **Fallback scoring** when AI fails
- **Audience-specific analysis**

## SyncManager

### Usage

```typescript
import { SyncManager } from '@/lib/syncManager';
import { useGameStore } from '@/features/game/store';

// Initialize on app startup
await SyncManager.initialize();

// Start periodic sync
SyncManager.startPeriodicSync();

// Manual sync
await SyncManager.syncUserProgress();

// Force sync (bypasses checks)
await SyncManager.forceSync();

// Check sync status
const status = await SyncManager.getSyncStatus();
console.log(status.isOnline, status.queuedItems);

// Set conflict resolution strategy
SyncManager.setConflictResolutionStrategy('merge');

// Update online status
SyncManager.setOnlineStatus(false); // Going offline
SyncManager.setOnlineStatus(true); // Back online

// Cleanup on app shutdown
SyncManager.cleanup();
```

### Features

- **Periodic background sync** (30-second intervals)
- **Offline queue** for failed syncs
- **Conflict resolution** strategies:
  - `local-wins`: Local state takes precedence
  - `server-wins`: Server state takes precedence
  - `merge`: Combine both states
  - `manual`: User intervention (currently uses merge)
- **Online/offline detection**
- **Retry logic** with exponential backoff
- **Persistent storage** using expo-secure-store

### Conflict Resolution

When local and server states conflict, the sync manager uses the configured strategy:

```typescript
// Set strategy
SyncManager.setConflictResolutionStrategy('local-wins');

// Get current strategy
const strategy = SyncManager.getConflictResolutionStrategy();
```

## Prerequisites System

### Usage

```typescript
import { useGameStore } from '@/features/game/store';
import { isLevelUnlocked, getNextUnlockableLevel } from '@/features/levels/data';

const gameStore = useGameStore.getState();

// Check if level is unlocked
const unlocked = gameStore.isLevelUnlocked('level_02', ['level_01']);

// Alternative: Check using data helper
const level = getLevelById('level_02');
const isUnlocked = isLevelUnlocked(level, gameStore.completedLevels);

// Check and unlock all available levels
const allLevels = await fetchLevelsFromApi();
gameStore.checkAndUnlockLevels(allLevels);

// Get next unlockable level
const nextLevel = getNextUnlockableLevel('level_01');
```

### Level Definition

```typescript
{
  id: 'level_02',
  title: 'Sort Dictionary List',
  prerequisites: ['level_01'], // Must complete level_01 first
  // ... other properties
}
```

### Implementation Details

- Levels are automatically unlocked when prerequisites are completed
- The `checkAndUnlockLevels()` method should be called after level completion
- Fallback to index-based ordering if no prerequisites specified
- Works seamlessly with both API and fallback level data

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const result = await ImageScoringService.scoreImage(input);
} catch (error) {
  // Service returns safe default values on failure
  console.error('Scoring failed:', error);
}
```

### Logging

All services use the centralized logger:

```typescript
import { logger } from '@/lib/logger';

logger.error('ServiceName', error, { operation: 'methodName', context });
```

## Testing

Each service includes batch processing capabilities:

```typescript
// Batch image scoring
const results = await ImageScoringService.scoreImages([
  { targetImageUrl: '...', resultImageUrl: '...' },
  { targetImageUrl: '...', resultImageUrl: '...' },
]);

// Batch code scoring
const results = await CodeScoringService.scoreCodes([
  { code: '...', language: 'PYTHON 3.10', testCases: [...] },
  { code: '...', language: 'JAVASCRIPT', testCases: [...] },
]);

// Batch copy scoring
const results = await CopyScoringService.scoreCopies([
  { text: '...', briefTone: '...' },
  { text: '...', briefTone: '...' },
]);
```

## Performance Considerations

- **Timeout protection**: All API calls have configurable timeouts
- **Retry logic**: Exponential backoff for transient failures
- **Fallback mechanisms**: Graceful degradation when AI/API fails
- **Caching**: Consider caching results for repeated evaluations
- **Batch processing**: Use batch methods for multiple submissions

## API Integration Notes

### Backend Endpoints

The code scoring service expects these backend endpoints:

- `POST /api/analyzer/execute-code`: Execute code in sandbox
- Input: `{ code, language, testInput, functionName }`
- Output: `{ success, output, error }`

### AI Proxy

All scoring services use `AIProxyClient`:

- `compareImages()`: Image similarity comparison
- `generateText()`: Text generation for analysis

## Storage

- **Secure Storage**: Uses `expo-secure-store` (native) or `localStorage` (web)
- **Offline Queue**: Persisted across app sessions
- **Sync Timestamp**: Tracks last successful sync

## Contributing

When adding new scoring services:

1. Follow the existing pattern (Input -> Result -> Batch)
2. Include comprehensive error handling
3. Add fallback mechanisms
4. Implement batch processing
5. Document edge cases
6. Add TypeScript types
7. Use centralized logger

## License

Internal use only.
