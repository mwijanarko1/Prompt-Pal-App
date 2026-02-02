# Backend Logic Refactoring Plan

## Executive Summary

This plan addresses **all 10 identified backend logic issues** across 3 priority tiers, with estimated **8-12 hours total implementation time**. Fixes are organized into **phases** to minimize breaking changes and allow incremental rollout.

---

## Assessment: NO BACKEND CHANGES REQUIRED

**Good news:** Your backend already has all necessary endpoints for sync!

### Available Endpoints (from API_DOCS.md)

| Endpoint | Method | Purpose | Frontend Method |
|----------|---------|----------|----------------|
| `/api/v1/user/game-state` | GET | Fetch current game state | `fetchServerProgress()` |
| `/api/v1/user/game-state` | PUT | Update game state | `sendProgressToServer()` |
| `/api/v1/user/sync` | GET | Full sync (all user data) | Alternative approach |

### Schema Match

**Frontend GameState** (`src/features/game/store.ts`):
```typescript
{
  currentLevelId: string | null,
  lives: number,
  score: number,
  isPlaying: boolean,
  unlockedLevels: string[],
  completedLevels: string[]
}
```

**Backend GameState** (API_DOCS.md lines 467-481):
```typescript
{
  userId: string,      // Added by backend
  appId: string,       // Added by backend
  currentLevelId: string | null,
  lives: number,
  score: number,
  isPlaying: boolean,
  unlockedLevels: string[],
  completedLevels: string[],
  createdAt: number,    // Added by backend
  updatedAt: number     // Added by backend
}
```

**Result:** Perfect match - backend adds metadata fields, frontend only syncs game-relevant fields.

---

## Phase 1: Critical Fixes (4 hours)

### Fix #4: Fix Redundant Token Retrieval (15 min)

**File:** `src/lib/token-utils.ts:52`

**Change:** Use `skipCache: true` for fresh token retrieval instead of double-calling `getToken()`.

**Implementation:**
```typescript
// BEFORE:
const freshToken = await getToken();

// AFTER:
const freshToken = await getToken({ skipCache: true });
```

---

### Fix #7: Double State Initialization - Option B (30 min)

**Strategy:** Keep only rehydration-driven loading (remove hook-based auto-sync)

**File 1:** `src/features/user/store.ts:302-324`
- Remove `state.loadFromBackend()` call from `onRehydrateStorage`
- Keep only error handling

**File 2:** `src/hooks/useGameStateSync.ts:16-54`
- Remove auto-sync on mount
- Keep manual sync via `syncToBackend()` return value
- Remove `hasSyncedRef` state management

**Rationale:** Zustand's persist middleware already loads from storage; backend sync happens periodically via SyncManager.

---

### Fix #1: Consolidate Dual API Clients (2 hours)

**New File:** `src/lib/unified-api.ts`

**Features:**
- Single axios-based client replacing both `ApiClient` and `aiProxy`
- Unified interceptors (token refresh, retry, error handling)
- All game state methods: `getGameState()`, `updateGameState()`, `getUserUsage()`, `getUserProgress()`
- All AI proxy methods: `generateText()`, `generateImage()`, `compareImages()`, `evaluateImageComparison()`

**Migration Plan:**
1. Create unified-api.ts (copy patterns from both api.ts and aiProxy.ts)
2. Update AI operations:
   - `src/lib/scoring/codeScoring.ts`
   - `src/lib/scoring/imageScoring.ts`
   - `src/lib/scoring/copyScoring.ts`
   - `src/app/(tabs)/game/[id].tsx`
   - `src/lib/nanoAssistant.ts`
3. Update game/user stores:
   - `src/hooks/useGameStateSync.ts`
   - `src/features/user/store.ts`
   - `src/features/game/store.ts`
4. Update other usages:
   - `src/lib/usage.ts`
   - `src/lib/auth-sync.tsx`

---

### Fix #2: Remove Singleton Token Mutation (30 min)

**File:** `src/lib/api.ts:671-678`
- Delete `export const apiClient = new ApiClient("")`
- Delete `export function setApiClientToken()`
- Keep only `export function createApiClient(token)`

**File:** `src/lib/auth-sync.tsx`
- Remove `setApiClientToken()` calls (lines 69, 106)
- Token now handled by `createUnifiedClient(getToken)` pattern

---

### Fix #3: Implement Proper Backend Sync (1.5 hours)

**Files:** `src/lib/syncManager.ts:293-320`

**Implementation:**

```typescript
private static async fetchServerProgress(): Promise<Partial<GameState> | null> {
  try {
    const { getToken } = await import('@/lib/auth');
    const token = await getToken();
    
    if (!token) {
      logger.warn('SyncManager', 'No token available');
      return null;
    }
    
    const { createUnifiedClient } = await import('@/lib/unified-api');
    const client = createUnifiedClient(token);
    
    const response = await client.getGameState();
    
    return {
      currentLevelId: response.currentLevelId,
      lives: response.lives,
      score: response.score,
      isPlaying: response.isPlaying,
      unlockedLevels: response.unlockedLevels,
      completedLevels: response.completedLevels
    };
  } catch (error) {
    logger.warn('SyncManager', 'Failed to fetch server progress', { error });
    return null;
  }
}

private static async sendProgressToServer(state: Partial<GameState>): Promise<void> {
  try {
    const { getToken } = await import('@/lib/auth');
    const token = await getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const { createUnifiedClient } = await import('@/lib/unified-api');
    const client = createUnifiedClient(token);
    
    await client.updateGameState(state);
    
    logger.info('SyncManager', 'Progress synced to server');
  } catch (error) {
    logger.error('SyncManager', error, { operation: 'sendProgressToServer' });
    throw error;
  }
}
```

**Enable Periodic Sync:**
- File: `src/app/_layout.tsx:35`
- Re-enable `SyncManager.startPeriodicSync()`

---

### Fix #5: Audit & Remove Dead Endpoints (30 min)

**File:** `src/lib/api.ts:355-380, 486-520`

**Delete Methods:**
- `getDailyTasks()` - `/api/analyzer/daily-tasks`
- `getTaskById()` - `/api/analyzer/tasks/{id}`
- `getUserTasks()` - `/api/analyzer/users/{id}/tasks`
- `getUserImageTasks()` - `/api/analyzer/users/{id}/image-tasks`
- `createUser()` - `/api/analyzer/users/create`
- `getUserById()` - `/api/analyzer/users/{id}`

**Verification:** Ensure no code uses these methods before deletion.

---

### Fix #6: Deprecate UserService (15 min)

**File:** `src/lib/userService.ts`

**Action:** Delete entire file

**Reason:** No usage found via grep search. User data now managed via Clerk + unified API client.

---

## Phase 2: Medium Priority Fixes (1.5 hours)

### Fix #8: Remove GeminiService Placeholders (30 min)

**File:** `src/lib/gemini.ts:31-98`

**Changes:**
- Remove artificial delays (`await new Promise(resolve => setTimeout(resolve, 2000))`)
- Remove placeholder fallbacks (`https://picsum.photos`, `Math.floor(Math.random() * 101)`)
- Replace with proper error throwing
- Use unified client for API calls

---

### Fix #9: Add Network Sync Debounce (30 min)

**File:** `src/lib/network.ts:4-12`

**Implementation:**
```typescript
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 5000;

export function initializeNetworkListener() {
  const unsubscribe = NetInfo.addEventListener(state => {
    SyncManager.setOnlineStatus(state.isConnected ?? false);
    
    if (state.isConnected) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      
      debounceTimer = setTimeout(() => {
        SyncManager.syncUserProgress();
      }, DEBOUNCE_MS);
    }
  });
  return unsubscribe;
}
```

---

### Fix #10: Remove Client-Side Rate Limiting (30 min)

**File:** `src/lib/rateLimiter.ts`

**Action:** Delete entire file

**File:** `src/lib/aiProxy.ts:5, 185, 213`

**Action:** Remove rate limit checks (`isTextGenerationAllowed()`, `isImageGenerationAllowed()`)

**Reason:** Trust server rate limiting (30 req/min). Remove false security of client-side limits.

---

## Testing Strategy

### Jest Unit Tests

**New Test Files:**

1. **`__tests__/lib/unified-api.test.ts`** (150 lines)
   - Test token interceptor
   - Test retry logic
   - Test auth refresh on 401
   - Test all API methods

2. **`__tests__/lib/syncManager.test.ts`** (100 lines)
   - Test `fetchServerProgress()`
   - Test `sendProgressToServer()`
   - Test offline queue
   - Test conflict resolution

3. **`__tests__/lib/token-utils.test.ts`** (50 lines)
   - Test token caching
   - Test `skipCache` behavior
   - Test expiration checks

4. **`__tests__/lib/network.test.ts`** (30 lines)
   - Test debounce logic
   - Test multiple network changes

**Deleted Tests:**
- `__tests__/lib/rateLimiter.test.ts` (removing rate limiter)

### Manual Testing Checklist

| Feature | Test Steps | Expected Result |
|----------|-------------|-----------------|
| **Auth** | Sign in, refresh page | Token refreshes automatically |
| **Game Sync** | Complete level, wait 30s | Server updated, persists across reload |
| **Offline Queue** | Go offline, complete level | Queued, synced when online |
| **Network Debounce** | Toggle network 5 times | Only 1 sync after 5s |
| **Double State** | Fresh install | Data loads once, no duplicate calls |
| **Unified Client** | Generate image, compare, get usage | All work via unified client |
| **Token Refresh** | Wait for token expiry | Auto-refreshes without error |

### Light Detox E2E Tests

**New File:** `e2e/sync-flow.e2e.ts`

**Test Scenarios:**
1. Sync game state on level completion
2. Queue sync when offline
3. Verify progress persists across reloads

---

## Implementation Timeline

### Week 1: Critical Fixes (8 hours)

**Day 1** (2 hours)
- Fix #4: Token retrieval (15 min)
- Fix #7: Double state init (30 min)
- Fix #5: Dead endpoints (30 min)
- Fix #6: Delete UserService (15 min)

**Day 2-3** (3.5 hours)
- Fix #1: Create unified-api.ts (1.5 hours)
- Fix #1: Migrate AI operations (1 hour)
- Fix #1: Migrate game/user stores (30 min)
- Fix #1: Remove singleton (30 min)

**Day 4** (1.5 hours)
- Fix #3: Implement SyncManager backend sync (1 hour)
- Manual testing: Full sync flow (30 min)

**Day 5** (2 hours)
- Write Jest tests for unified-api (1 hour)
- Write Jest tests for syncManager (30 min)
- Run all tests, fix failures (30 min)

### Week 2: Remaining Fixes (3 hours)

**Day 6** (1.5 hours)
- Fix #8: Remove GeminiService placeholders (30 min)
- Fix #9: Add network debounce (30 min)
- Fix #10: Remove rate limiting (30 min)

**Day 7** (1 hour)
- Detox E2E test setup (30 min)
- Write sync flow E2E tests (30 min)

**Day 8-9** (4 hours)
- Full manual testing suite (2 hours)
- Bug fixes from testing (2 hours)

**Day 10** (2 hours)
- Code review and cleanup
- Documentation updates
- Create release notes

**Total: ~10-12 hours spread over 2 weeks**

---

## Risk Assessment

| Issue | Risk Level | Rollback Plan |
|-------|------------|---------------|
| #3 SyncManager | None | Re-enable in _layout.tsx |
| #1 API Clients | High | Keep old files, revert imports |
| #2 Singleton Token | Medium | Re-add deprecated exports |
| #4 Token Retrieval | Low | Revert single call to double |
| #7 Double State | Medium | Keep both, add debounce |
| #5 Dead Endpoints | Low | Git revert if needed |
| #6 UserService | Zero | Git revert |
| #8 Gemini | Low | Re-add fallbacks |
| #9 Debounce | Low | Remove debounce |
| #10 Rate Limits | Low | Revert numbers |

---

## Success Criteria

### Phase Complete When:

✅ **Critical Fixes:**
- Single API client (unified-api.ts) handles all requests
- No singleton token mutations
- SyncManager fetches/sends real data
- No double state initialization
- All dead endpoints removed

✅ **Tests:**
- Jest unit tests pass (100% coverage)
- Detox E2E tests pass (stable)
- Manual testing checklist complete

✅ **Performance:**
- No redundant token calls
- No artificial delays
- Network syncs debounced to 5s
- Battery usage reduced (no wasteful syncs)

✅ **Code Quality:**
- TypeScript compilation passes
- No console errors
- Linter passes
- Code review approved

---

## Priority Actions Summary

### Immediate (Critical)
1. ✅ Fix redundant token retrieval
2. ✅ Fix double state initialization
3. ✅ Consolidate API clients
4. ✅ Remove singleton token mutation
5. ✅ Implement proper backend sync
6. ✅ Remove dead endpoints
7. ✅ Delete UserService

### Short-Term (Medium)
8. ✅ Remove GeminiService placeholders
9. ✅ Add network debounce
10. ✅ Remove client-side rate limiting

---

**Last Updated:** 2026-01-31
**Status:** Ready for Implementation
