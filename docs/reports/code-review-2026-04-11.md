# Code Review - April 11, 2026

## Scope

Reviewed the current working tree with emphasis on the modified/untracked superprompt flow, Convex AI quota helpers, navigation changes, and new tests.

## Findings

### PromptPal/__tests__/features/superprompts/categoryModuleMap.test.ts

`PromptPal/__tests__/features/superprompts/categoryModuleMap.test.ts:3` - TypeScript fails because the new test relies on global `describe`, `it`, and `expect`, while this repo's existing tests import those symbols from `@jest/globals`. Running `./node_modules/.bin/tsc --noEmit` fails only on this file. Either import `describe`, `expect`, and `it` from `@jest/globals`, or add the missing global Jest type dependency/config intentionally.

### PromptPal/convex/superprompts.ts

`PromptPal/convex/superprompts.ts:88` - Validation `ConvexError`s are thrown before the structured error-return block at line 121. The Generate screen catches rejected actions generically, so backend messages like "Nothing to refine yet", "Describe what you want before generating", and "Input is too long" are replaced with "Something went wrong. Try again." Move the validation into the same `try`/structured return path or have the client unwrap Convex action errors.

`PromptPal/convex/superprompts.ts:142` - Structured AI/quota errors are returned without `remainingQuota`, `limit`, or `tier`, even though the client logs and UI paths expect those fields. Quota-block analytics and the limit banner lose useful context exactly when the user is blocked.

### PromptPal/src/app/(tabs)/generate.tsx

`PromptPal/src/app/(tabs)/generate.tsx:136` - The client catch block discards all action error details and always shows a generic message. This combines with the server-side validation issue above: any rejected action outside the server's internal `try` block becomes indistinguishable from a network/runtime failure.

### PromptPal/convex/seed.ts

`PromptPal/convex/seed.ts:14` - Existing app limit migration only checks `freeLimits.imageCalls !== 50`. The new superprompt flow consumes `textCalls` via `checkAndIncrementQuota`, but an existing `prompt-pal` app record with stale or missing text limits will not be patched if `imageCalls` is already 50. The seed should compare the full free/pro limit shape, especially `textCalls`, before deciding no update is needed.

### PromptPal/convex/_generated/api_cjs.d.cts

`PromptPal/convex/_generated/api_cjs.d.cts:11` - The ESM generated API types include `superprompts`, but the CommonJS generated declaration does not. This looks like partial Convex codegen output. CJS TypeScript consumers of `_generated/api_cjs` will not see `api.superprompts.generatePrompt`, and the mismatch is a release risk. Regenerate the Convex API files together.

## Verification

- `python3 ~/.agents/scripts/validate_agent_policy.py` - passed.
- `./node_modules/.bin/tsc --noEmit` - failed on `__tests__/features/superprompts/categoryModuleMap.test.ts` missing Jest globals.
- `./node_modules/.bin/jest __tests__/features/superprompts/categoryModuleMap.test.ts --runInBand` - passed.

