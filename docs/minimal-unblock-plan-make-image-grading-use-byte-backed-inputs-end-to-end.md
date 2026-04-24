# Minimal Unblock Plan: Make Image Grading Use Byte-Backed Inputs End-to-End

## Summary

Fix the image grading failure by removing provider-side URL fetching from `ai.evaluateImage` and ensuring both image gameplay routes forward the generated image `storageId`.

The current backend bug is not just "Convex URL fetch failed." The deeper issue is that the `userImageStorageId` branch is incomplete: `ctx.storage.get(...)` returns a `Blob`, but the installed AI SDK accepts image parts as `Uint8Array | ArrayBuffer | Buffer | base64 string | URL`, not `Blob`. In addition, [PromptPal/src/app/game/quest/[id].tsx](/Users/mikhail/Documents/CURSOR%20CODES/In%20Progress/Prompt%20Pal%20App/PromptPal/src/app/game/quest/[id].tsx:700) still does not pass `userImageStorageId`, so one image flow always falls back to URL-based evaluation.

This plan keeps scope to the unblock only:
- fix backend image serialization
- fix route parity so both image flows send `storageId`
- add focused tests
- do not include debug-log cleanup or fallback UX in this pass

## Public API / Interface Changes

- `ai.generateImage` contract stays as-is:
  - returns `imageUrl`, `storageId`, `mimeType`, quota fields
- `ai.evaluateImage` action args stay as-is:
  - `taskId`
  - `userImageUrl`
  - optional `userImageStorageId`
  - `expectedImageUrl`
  - other grading metadata
- Behavioral change inside `ai.evaluateImage`:
  - `userImageStorageId` becomes the primary source for the user image
  - both images are converted to byte-backed AI SDK image parts before calling Gemini
  - provider-side remote download is no longer used in the normal success path

## Implementation

### 1. Extract image-part preparation into a small backend helper module

Create a new backend helper file, recommended path:
- `PromptPal/convex/imageEvaluation.ts`

Move the image-input preparation logic out of [PromptPal/convex/ai.ts](/Users/mikhail/Documents/CURSOR%20CODES/In%20Progress/Prompt%20Pal%20App/PromptPal/convex/ai.ts:1181) into pure helpers so it can be unit tested without mocking the full Convex action runtime.

Add these helpers:

1. `blobToImageBytes(blob: Blob): Promise<Uint8Array>`
- Calls `blob.arrayBuffer()`
- Wraps the result in `new Uint8Array(...)`

2. `resolveBlobMediaType(blob: Blob, fallback?: string): string`
- Returns `blob.type` if present
- Else returns fallback if provided
- Else defaults to `"image/png"`

3. `fetchImageUrlAsPart(url: string): Promise<{ image: Uint8Array; mediaType: string }>`
- Uses server-side `fetch`
- Requires `response.ok === true`
- Reads `content-type`
- Rejects non-image content types
- Converts response bytes to `Uint8Array`
- Returns `{ image, mediaType }`

4. `blobAsImagePart(blob: Blob, fallbackMediaType?: string): Promise<{ type: "image"; image: Uint8Array; mediaType: string }>`
- Converts Convex `Blob` into an AI SDK-compatible image part

5. `buildEvaluationImageParts(args): Promise<[expectedImagePart, userImagePart]>`
- `expectedImageUrl` always resolves via `fetchImageUrlAsPart(...)`
- `userImageStorageId` path:
  - if provided and `ctx.storage.get(...)` returns a blob, use `blobAsImagePart(...)`
- fallback user path:
  - if storage blob is missing and `userImageUrl` exists, use `fetchImageUrlAsPart(...)`
- If neither source yields a usable user image, throw a normal `Error` with a precise message:
  - `"Unable to load generated image for evaluation."`

Default choice for this pass:
- Keep `expectedImageUrl` URL-backed and fetch it server-side.
- Do not add `expectedImageStorageId` or migrate level assets into Convex storage.

### 2. Update `ai.evaluateImage` to use only prepared byte-backed image parts

In [PromptPal/convex/ai.ts](/Users/mikhail/Documents/CURSOR%20CODES/In%20Progress/Prompt%20Pal%20App/PromptPal/convex/ai.ts:1181):

- Import the new helper(s) from `convex/imageEvaluation.ts`
- Before `aiGenerateText(...)`, resolve:
  - `expectedImagePart`
  - `userImagePart`
- Replace the current message content:

```ts
{ type: "image", image: new URL(args.expectedImageUrl) }
storedUserImage ? { type: "image", image: storedUserImage } : { type: "image", image: new URL(args.userImageUrl) }
```

with the prepared parts returned by the helper.

Keep the existing quota refund and provider-error mapping behavior unchanged.

Do not add extra debug logging in this pass beyond what already exists.

### 3. Fix route parity so both image screens pass `storageId`

Update both image gameplay entrypoints:

- [PromptPal/src/app/game/[id].tsx](/Users/mikhail/Documents/CURSOR%20CODES/In%20Progress/Prompt%20Pal%20App/PromptPal/src/app/game/[id].tsx:732)
- [PromptPal/src/app/game/quest/[id].tsx](/Users/mikhail/Documents/CURSOR%20CODES/In%20Progress/Prompt%20Pal%20App/PromptPal/src/app/game/quest/[id].tsx:688)

Required behavior:
- After `generateImage(prompt)`, capture:
  - `generateResult.imageUrl`
  - `generateResult.storageId`
- Pass `userImageStorageId: generatedStorageId` into `evaluateImage(...)` in both files

The standard level screen already does this. The quest screen must be brought to parity.

### 4. Remove duplicated request-shaping with a tiny shared helper

To prevent the same omission from recurring, add a small shared client helper, recommended path:
- `PromptPal/src/features/game/utils/imageEvaluationRequest.ts`

Add a pure function such as:
- `buildImageEvaluationRequest({ levelId, targetImageUrlForEvaluation, hiddenPromptKeywords, style, prompt, generateResult })`

It returns the exact object expected by `evaluateImage(...)`, including `userImageStorageId` when present.

Use this helper in both:
- `src/app/game/[id].tsx`
- `src/app/game/quest/[id].tsx`

This is a small refactor, but it turns the route-parity fix into one shared contract and gives us an easy unit-test target.

## Test-First Plan

### 1. Add backend helper tests first

Create:
- `PromptPal/__tests__/convex/imageEvaluation.test.ts`

Cover:
1. `blobAsImagePart` converts a Blob into `Uint8Array` and preserves media type
2. `blobAsImagePart` falls back to `"image/png"` when blob type is empty
3. `fetchImageUrlAsPart` returns bytes + content type for a successful image response
4. `fetchImageUrlAsPart` throws on non-200 responses
5. `fetchImageUrlAsPart` throws on non-image content type
6. `buildEvaluationImageParts` prefers storage blob over `userImageUrl`
7. `buildEvaluationImageParts` falls back to URL when storage blob is missing

Use `global.fetch = jest.fn()` in the test file and restore it between cases.

### 2. Add shared request-shaping test before route edits

Create:
- `PromptPal/__tests__/features/game/utils/imageEvaluationRequest.test.ts`

Cover:
1. Includes `userImageStorageId` when `generateResult.storageId` exists
2. Omits `userImageStorageId` when absent
3. Preserves `taskId`, `expectedImageUrl`, `hiddenPromptKeywords`, `style`, and `userPrompt`

This gives a regression test for the exact omission currently present in the quest flow.

### 3. Keep existing generation/scoring tests green

Run existing targeted tests after the new ones pass:
- `PromptPal/__tests__/convex/imageGeneration.test.ts`
- `PromptPal/__tests__/lib/scoring/imageScoring.test.ts`

## Verification Commands

Run the narrowest relevant checks first:

1. `cd PromptPal && ./node_modules/.bin/jest __tests__/convex/imageEvaluation.test.ts --runInBand`
2. `cd PromptPal && ./node_modules/.bin/jest __tests__/features/game/utils/imageEvaluationRequest.test.ts --runInBand`
3. `cd PromptPal && ./node_modules/.bin/jest __tests__/convex/imageGeneration.test.ts --runInBand`
4. `cd PromptPal && ./node_modules/.bin/jest __tests__/lib/scoring/imageScoring.test.ts --runInBand`

If time permits after the unblock is green:
5. `cd PromptPal && ./node_modules/.bin/jest --runInBand`

## Acceptance Criteria

The implementation is complete when all of the following are true:

1. `ai.evaluateImage` no longer passes `Blob` or remote `URL` objects directly to the AI SDK in the normal grading path.
2. The user-generated image is evaluated from byte-backed data when `userImageStorageId` is available.
3. Both image flows pass `userImageStorageId` into `evaluateImage(...)`.
4. If storage lookup fails, the backend can still evaluate using server-fetched `userImageUrl`.
5. Existing provider error mapping and quota refund behavior remain intact.
6. New focused Jest tests pass.

## Out of Scope

These are intentionally excluded from this pass:

- removing debug instrumentation from `convex/ai.ts` and `src/hooks/useConvexAI.ts`
- adding new grading-failed UI copy or fallback UX
- migrating target/reference images into Convex storage
- broader cleanup/refactor of image scoring or analytics

## Assumptions / Defaults

- The installed AI SDK version in this repo (`ai` 6.0.62, `@ai-sdk/google` 3.0.18) accepts `Uint8Array` image parts with `mediaType`, which matches the installed local type definitions.
- `targetImageUrlForEvaluation` remains a remote URL stored in level data and is accessible to server-side `fetch`.
- Loading single generated images into memory as `Uint8Array` is acceptable for this grading flow.
- Minimal unblock is preferred over immediate cleanup, so debug logs remain until grading is confirmed working.
