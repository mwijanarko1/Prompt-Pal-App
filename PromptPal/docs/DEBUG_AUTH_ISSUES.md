# Debug Summary: Convex Authentication Issues

**Date**: February 3, 2026  
**Status**: In Progress  
**Priority**: Critical

---

## Issues Identified

### 1. Invalid JWT Token Format
**Error**: `InvalidAuthHeader: Could not parse JWT payload. Check that the token is a valid JWT format`

**Root Cause**: The JWT token from Clerk is not being formatted correctly for Convex.

**Hypotheses**:
1. ❌ Clerk JWT Issuer Domain not configured in Convex dashboard
2. ❌ Token is null/undefined when fetched
3. ❌ Wrong token format (should be 3 base64 parts: `header.payload.signature`)
4. ⚠️ Convex dev server not running (types not generated)
5. ❌ `session.getToken()` called at wrong time

**Most Likely**: #1 - Clerk JWT configuration missing in Convex

### 2. Missing userId Parameter
**Error**: `ArgumentValidationError: Object is missing the required field userId`

**Root Cause**: `getUserUsage` query expects userId as parameter, but we're trying to get it from auth automatically.

**Status**: ✅ **FIXED** - Updated query to use `ctx.auth.getUserIdentity()`

---

## Fixes Applied

### Fix 1: Updated getUserUsage Query
**File**: `convex/queries.ts`

**Before**:
```typescript
args: {
  userId: v.string(),
  appId: v.string(),
},
```

**After**:
```typescript
args: {
  appId: v.string(),  // Removed userId - now from auth
},
handler: async (ctx, args) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const userId = identity.subject;
  // ... rest of handler
}
```

### Fix 2: Improved Token Validation
**File**: `src/lib/convex-client.ts`

**Changes**:
- Added JWT format validation (check for 3 parts)
- Added debug logging
- Better error handling

---

## Required Actions (User Must Do)

### 1. Configure Clerk JWT in Convex Dashboard ⚠️ CRITICAL

You **MUST** configure the Clerk JWT Issuer Domain in Convex dashboard:

1. Go to [convex.dev](https://convex.dev) dashboard
2. Select your project
3. Go to **Settings** → **Authentication**
4. Click **Configure** on **Clerk**
5. Enter your Clerk Issuer Domain:
   - Format: `https://your-domain.clerk.accounts.dev`
   - Or: `https://accounts.clerk.dev`
   - Find this in Clerk Dashboard → Configure → JWT Templates
6. Click **Save**

**Why this matters**: Convex needs to verify the JWT signature. Without this, all authenticated requests fail.

### 2. Restart Convex Dev Server

```bash
# In your terminal
cd PromptPal
npx convex dev

# This will:
# - Regenerate types with updated queries
# - Deploy the fixed getUserUsage query
# - Show real-time logs
```

### 3. Verify Environment Variables

Check your `.env.local`:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev  # Must match Convex config
```

### 4. Clear App Cache (iOS Simulator)

```bash
# In simulator, press Cmd+Shift+K to clear cache
# Or restart the simulator
```

---

## Testing Steps

### Step 1: Verify Convex Dev Server is Running
```bash
npx convex dev
# Should show: "Watching for file changes..."
```

### Step 2: Check Convex Logs
In the convex dev terminal, you should see:
- Query/mutation calls
- Auth success/failure messages

### Step 3: Test Authentication
1. Sign in to the app
2. Check console for JWT token logs
3. Look for: "Got valid JWT token" in logs

### Step 4: Test Queries
Try loading:
- Home screen (uses getUserUsage)
- Library (uses getLibraryData)
- Profile (uses getUserResults)

---

## If Issues Persist

### Debug: Check JWT Configuration

1. **Verify Clerk JWT Template**:
   - Clerk Dashboard → JWT Templates
   - Should have template named "convex"
   - Claims should include: `sub`, `iat`, `exp`

2. **Check Convex Auth Settings**:
   - Convex Dashboard → Settings → Authentication
   - Should show: "Clerk: Configured"
   - Issuer domain must match exactly

3. **Add Debug Logs** (temporary):

Add to `src/lib/convex-client.ts`:
```typescript
client.setAuth(async () => {
  try {
    const clerkModule = await import('@clerk/clerk-expo');
    console.log('[DEBUG] Clerk module:', clerkModule);
    console.log('[DEBUG] Clerk instance:', clerkModule.Clerk);
    console.log('[DEBUG] Session:', clerkModule.Clerk?.session);
    
    const token = await clerkModule.Clerk?.session?.getToken();
    console.log('[DEBUG] Token:', token ? 'Present' : 'Missing');
    console.log('[DEBUG] Token format:', token?.split('.').length, 'parts');
    
    return token;
  } catch (error) {
    console.error('[DEBUG] Auth error:', error);
    return null;
  }
});
```

---

## Summary

**Applied Fixes**:
- ✅ Updated `getUserUsage` to get userId from auth context
- ✅ Improved JWT validation in convex-client.ts
- ✅ Better error logging

**Required User Actions**:
- ⚠️ **Configure Clerk JWT in Convex dashboard** (critical)
- ⚠️ **Restart convex dev server** to regenerate types
- ⚠️ **Verify environment variables**

**Expected Outcome**:
After completing the steps above, the app should:
- Successfully authenticate with Convex
- Load user data without errors
- Sync game state to backend

---

## References

- Convex Auth Docs: https://docs.convex.dev/auth/clerk
- Clerk JWT Docs: https://clerk.dev/docs/backend-requests/making-jwt-templates
- Team Channel: #promptpal-dev
