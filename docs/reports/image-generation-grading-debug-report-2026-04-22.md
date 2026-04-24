# Image Generation + Grading Debug Report (2026-04-22)

## Scope

This report documents the image module failures in PromptPal, including:
- image generation failures in `ai:generateImage`
- image grading failures in `ai:evaluateImage`
- runtime evidence collected
- code changes made
- current status and recommended next actions

## Initial Symptoms

### 1) Image generation failed
- Error surfaced in app:
  - `AI_REQUEST_FAILED`
  - provider: `gemini`
  - thrown from `convex/ai.ts` in `generateImage`

### 2) Later, generation worked but grading failed
- Error surfaced in app:
  - `AI_REQUEST_FAILED` from `ai:evaluateImage`
  - grading panel did not appear

## Debug Method Used

Debugging was performed using runtime instrumentation and NDJSON session logs:
- Session log file: `.cursor/debug-139464.log`
- Client-side instrumentation added in:
  - `src/hooks/useConvexAI.ts` (`generateImage` + `evaluateImage`)
- Server-side instrumentation added in:
  - `convex/ai.ts` (`generateImage` catch path and mapped errors)

## Timeline of Findings

### Phase A: `generateImage` root cause

#### Evidence
- Runtime provider detail eventually showed:
  - `API Key not found. Please pass a valid API key.`

#### Conclusion
- Root cause confirmed: missing/invalid backend Gemini API key.

#### Fixes applied
- `convex/geminiClient.ts`
  - Added fallback env var support:
    - `GEMINI_API_KEY`
    - `GOOGLE_GENERATIVE_AI_API_KEY`
    - `GOOGLE_API_KEY`
- `convex/aiProviderErrors.ts`
  - Added explicit mapping for API-key-missing errors.
- `convex/ai.ts`
  - Added provider detail passthrough in mapped `AI_REQUEST_FAILED` during debug.

### Phase B: quota follow-up

#### Evidence
- Runtime logs showed:
  - `AI_PROVIDER_QUOTA_EXCEEDED`
  - `statusCode: 429`

#### Conclusion
- API key was being used; provider quota/billing limits then became the active blocker.

### Phase C: `evaluateImage` grading failure

#### Evidence
- Clean repro logs in `.cursor/debug-139464.log`:
  - `generateImage` action invoked successfully
  - `evaluateImage` action invoked
  - `evaluateImage` failed with provider detail:
    - `Failed to download https://...convex.cloud/api/storage/...: 400 Bad Request`

#### Conclusion
- Grading failure occurs in provider-side fetch of generated image URL.
- This is not a UI rendering bug; the evaluation action fails before returning scoring data.

## Code Changes Made for Grading Path

### 1) Added `evaluateImage` instrumentation
- File: `src/hooks/useConvexAI.ts`
- Added logs:
  - before `evaluateImage` action call
  - after success
  - catch path on failure

### 2) Added provider-detail passthrough for `evaluateImage`
- File: `convex/ai.ts`
- In `evaluateImage` catch path, mapped generic provider failures include:
  - `Provider detail: ...`

### 3) Attempted direct-storage evaluation path
- Files:
  - `convex/ai.ts`
  - `src/hooks/useConvexAI.ts`
  - `src/app/game/[id].tsx`
- Changes attempted:
  - `generateImage` return extended with `storageId` and `mimeType`
  - `handleGenerate` passes `userImageStorageId` to `evaluateImage`
  - `evaluateImage` accepts optional `userImageStorageId` and tries `ctx.storage.get(...)` for model image input before URL fallback

## Current Runtime State (Latest Repro)

From `.cursor/debug-139464.log` latest entries:
- `generateImage` called
- `evaluateImage` called
- `evaluateImage` still fails with:
  - `AI_REQUEST_FAILED`
  - provider detail: failed to download Convex storage URL (400)

This indicates the attempted storage-ID route has not yet produced successful evaluation in current runtime behavior.

## Why Grading Is Not Showing

The image grading panel relies on successful `evaluateImage` response:
- `lastScore`, `feedback`, and `matchedKeywords` are only set after `evaluateImage` returns.
- When `evaluateImage` throws, those values are not populated, so grading UI does not appear like other modules.

## What Was Proven vs Not Proven

### Proven
- API key issue was real and resolved.
- Quota 429 was real at one point.
- Current grading blocker is in backend evaluate path, not UI component rendering.
- Provider cannot evaluate using current generated image URL fetch path.

### Not yet proven
- Whether Gemini in this exact runtime/provider setup accepts `ctx.storage.get(...)` result format directly for multimodal input.
- Whether target image URL path has intermittent accessibility constraints in provider fetch.

## Recommended Next Steps

1. Validate generated-image handoff format for `evaluateImage`
- Confirm the exact object type returned by `ctx.storage.get(...)` at runtime and convert explicitly (if needed) to provider-compatible image input.

2. Eliminate provider URL download dependency for user image
- Keep evaluation input fully in-memory for generated image bytes.

3. Add explicit branch logging inside `evaluateImage`
- Log whether storage-byte path or URL path is used for user image.
- Log `storedUserImage` null/non-null before calling Gemini.

4. Add graceful fallback UX
- If grading fails, show a specific message:
  - "Image generated, but grading failed due to evaluator fetch error."
- This avoids silent parity mismatch with code/copy modules.

5. After fix confirmation
- Remove temporary debug instrumentation in:
  - `convex/ai.ts`
  - `src/hooks/useConvexAI.ts`

## Files Touched During Debug Session

- `PromptPal/convex/ai.ts`
- `PromptPal/convex/geminiClient.ts`
- `PromptPal/convex/aiProviderErrors.ts`
- `PromptPal/src/hooks/useConvexAI.ts`
- `PromptPal/src/app/game/[id].tsx`

---

If needed, I can now do a cleanup pass (remove debug logs) or continue with a focused, single-path fix for `evaluateImage` image input serialization.
