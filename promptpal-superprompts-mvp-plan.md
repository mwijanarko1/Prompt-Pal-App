# PromptPal Superprompts MVP Plan

## Summary

Ship a new home-screen IA that makes PromptPal legible in one glance:

- `Train`: the current learning product, XP, streaks, quests, and modules.
- `Generate`: a fast utility mode that turns a plain-English idea into a copy-paste-ready prompt.

The MVP should replace the current dense home dashboard with a simple two-entry switchboard, add a dedicated `Generate` flow for `Image`, `Copy`, and `Code`, and use the post-copy moment to funnel users into the relevant training path. Keep auth required, keep free usage available via quotas, and defer advanced platform/tone controls to a later phase.

## Product Outcome

1. A new user lands on Home and immediately understands the app has two jobs: learn prompting or get a prompt fast.
2. A casual user can generate a prompt in under 30 seconds with one text input and one category choice.
3. After copying a result, the app nudges the user into the right learning path:
   - `Image` -> `image-generation`
   - `Copy` -> `copywriting`
   - `Code` -> `coding-logic`
4. Existing training functionality remains intact, just moved behind the `Train` destination instead of being the default home dashboard.
5. Monetization in MVP is quota-led, not feature-fragmented:
   - Free users can use Generate within existing quotas.
   - Pro users benefit from higher existing limits.
   - Advanced refinement/platform-specific versions are phase 2.

## IA And Navigation

### Route structure

Keep this inside the existing `/(tabs)` shell so auth, onboarding, and current gating behavior stay centralized.

- `src/app/(tabs)/index.tsx`
  - Replace current learning dashboard with the new switchboard home.
- `src/app/(tabs)/train.tsx`
  - New hidden tab route.
  - Hosts the current dashboard content now living in `index.tsx`.
- `src/app/(tabs)/generate.tsx`
  - New hidden tab route.
  - Hosts the Generate MVP flow.
- `src/app/(tabs)/_layout.tsx`
  - Add hidden triggers for `train` and `generate`.
  - Keep visible tabs unchanged: `Home`, `Profile`.

### Navigation behavior

- `Home` remains the visible tab and becomes the switchboard.
- Tapping `Train` pushes to `/train`.
- Tapping `Generate` pushes to `/generate`.
- Post-copy CTA on Generate deep-links directly to the relevant module route:
  - `/game/levels/image-generation`
  - `/game/levels/copywriting`
  - `/game/levels/coding-logic`

This is the MVP funnel. Do not add a broader “recommended training carousel” yet.

## Screen-Level Spec

### 1. Home switchboard

Replace the current dashboard with a minimal branded screen:

- Title: `PromptPal`
- Primary choice cards/buttons:
  - `Train`
    - Supporting copy: “Learn prompts, challenges, XP, streaks.”
  - `Generate`
    - Supporting copy: “Just give me a prompt.”
- Keep the screen intentionally sparse.
- No quest cards, mastery bars, module list, or settings modal on this screen.
- Keep profile access via the bottom tab.
- Optional small line below cards: “Two ways to get better: practice it or use it now.” Only include if the screen feels too bare.

### 2. Train screen

Move the current `/(tabs)/index.tsx` dashboard into `/(tabs)/train.tsx` with minimal functional changes:

- Preserve:
  - greeting
  - stats cards
  - mastery progress
  - daily quest
  - learning modules
  - settings modal
- Change only what is necessary:
  - heading/copy can be updated from generic “Home” framing to “Train”.
  - add a compact back affordance only if native tab UX feels unclear in testing.
- Do not redesign this screen in MVP.

### 3. Generate screen

A chat-like prompt builder, not a multi-field form.

#### Layout

- Category chips/segmented control at top:
  - `Image`
  - `Copy`
  - `Code`
- Single multiline text input
  - Placeholder: `Describe what you want in a few words...`
- Primary CTA:
  - `Generate`
- Result area after success:
  - short label like `Ready to copy`
  - generated prompt body
  - large `Copy` button
- Inline refine chips after first result:
  - `Make it more detailed`
  - `Simplify it`
  - `Change the tone`

#### UX rules

- No more than one freeform input in MVP.
- No dropdown-heavy configuration.
- Default output target is generic cross-model prompt quality, not vendor-specific formatting.
- Refine chips operate on the generated prompt/result already on screen.
- Show loading state inline in the result area, not as a blocking modal.
- On copy success, show the training nudge immediately below the copied result.

### 4. Post-copy funnel

After a successful copy action, show an inline conversion strip:

- Headline: `Want to learn how to write this yourself?`
- Supporting copy: `It takes about 3 minutes.`
- CTA: `Go to Train`
- Deep-link target is category-specific module route, not the generic train dashboard.

Only show this after a successful copy, not after generation alone.

## Backend And Logic Plan

## New public interfaces / API changes

### New client-side types

Add shared types for the new flow:

- `GenerateCategory = "image" | "copy" | "code"`
- `RefineMode = "more_detailed" | "simplify" | "change_tone"`
- `GeneratePromptInput`
  - `category`
  - `idea`
  - `existingPrompt?`
  - `refineMode?`
- `GeneratePromptResult`
  - `prompt`
  - `category`
  - `remainingQuota`
  - `limit`
  - `tier`

Use `copy`, not `copywriting`, in the new Generate surface. Add a single mapping helper to convert Generate category to learning module id.

### New server action

Add a dedicated Convex action instead of calling generic `api.ai.generateText` directly from the screen:

- `api.superprompts.generatePrompt`

Input:
- `category: "image" | "copy" | "code"`
- `idea: string`
- `existingPrompt?: string`
- `refineMode?: "more_detailed" | "simplify" | "change_tone"`

Output:
- `prompt: string`
- `category`
- `remainingQuota: number`
- `limit: number`
- `tier: "free" | "pro"`

### Why this server action exists

- Keeps prompt-construction logic server-owned.
- Reuses quota enforcement safely.
- Gives one contract for both first-pass generation and refinements.
- Avoids spreading system-prompt logic across screens.

### Internal server implementation

Refactor text-generation internals so quota-backed text generation can be reused without duplicating logic in `convex/ai.ts`.

Implementation direction:

1. Extract the reusable quota-backed text generation helper from `convex/ai.ts`.
2. Create `convex/superprompts.ts` with `generatePrompt`.
3. Build category-specific system prompts on the server:
   - `image`: visual composition, style, medium, lighting, framing, exclusions
   - `copy`: audience, tone, objective, structure, CTA
   - `code`: stack, requirements, constraints, output format, edge cases
4. For refinement requests:
   - feed `existingPrompt` plus `refineMode`
   - return a fully rewritten prompt, not patch instructions
5. Use current `appId: "prompt-pal"` and existing text quota path.

## Analytics And Measurement

Extend `src/lib/analytics.ts` with MVP events:

- `superprompt_home_train_tapped`
- `superprompt_home_generate_tapped`
- `superprompt_generate_submitted`
- `superprompt_generate_succeeded`
- `superprompt_generate_failed`
- `superprompt_refine_tapped`
- `superprompt_copied`
- `superprompt_train_nudge_tapped`
- `superprompt_quota_blocked`

Minimum event params:

- `category`
- `refine_mode` where relevant
- `tier`
- `remaining_quota` where available

Success metrics for MVP:

- tap-through from Home -> Generate
- Generate success rate
- copy rate after successful generation
- copy -> Train conversion rate
- quota hit rate by tier/category

## Monetization And Gating

### MVP behavior

- Keep Generate available to all signed-in users.
- Consume existing text-call quota for:
  - initial generation
  - each refine action
- Keep current app-plan limits unchanged for launch:
  - free: existing lower monthly limits
  - pro: existing higher monthly limits
- Do not gate the whole Generate route behind Pro.

### Explicitly deferred to phase 2

- unlimited-only Generate access
- Pro-only refine options
- platform-specific output variants like `ChatGPT`, `Claude`, `Gemini`, `Midjourney`
- saved prompt history
- favorites/bookmarks
- share/export formatting presets

## Implementation Breakdown

### Phase 1: IA and screen extraction

- Extract current home dashboard into a reusable `TrainDashboardScreen` component or equivalent screen module.
- Point `/(tabs)/train.tsx` at that extracted screen.
- Replace `/(tabs)/index.tsx` with the two-choice switchboard.
- Update tab layout with hidden `train` and `generate` routes.

### Phase 2: Generate MVP

- Build `Generate` screen UI and local screen state.
- Add category selector, text composer, generate action, result card, copy action, refine chips.
- Add category-to-module mapping helper.
- Add post-copy funnel strip.

### Phase 3: Backend contract

- Add `convex/superprompts.ts`.
- Extract shared quota-backed text generation helper from existing AI logic.
- Add category-specific system-prompt templates.
- Return normalized quota metadata to client.

### Phase 4: Instrumentation and polish

- Add analytics events.
- Add empty/error/quota states.
- Add usage messaging when near limit.
- Confirm copy interactions use `expo-clipboard` consistently.

## Error And Edge-Case Handling

- Empty input: disable `Generate`.
- Duplicate tap while loading: block second submission.
- Quota exhausted:
  - keep the typed idea intact
  - show clear message
  - include CTA to `/paywall`
- AI failure:
  - preserve current input and previous successful result
  - show inline retry state
- Refine tapped before any result exists: do nothing; chips render only after first result.
- Category switched after result exists:
  - clear current result and refine state
  - keep typed idea unless product testing shows confusion
- Auth edge cases:
  - no new auth model; Generate remains inside current signed-in shell.

## Test Cases And Scenarios

### Unit tests

- category-to-module mapping helper returns correct module ids
- `generatePrompt` request builder chooses correct server prompt template by category
- refine requests send `existingPrompt` plus correct `refineMode`
- quota error is transformed into the expected client error state

### Component tests

- home switchboard renders only `Train` and `Generate` primary actions
- Generate button disabled until input has content
- result area appears after successful response
- refine chips appear only after a result exists
- copy success reveals the Train nudge
- quota error shows paywall CTA without clearing user input

### Integration / e2e

- signed-in user opens Home -> taps `Generate` -> submits idea -> gets result -> copies -> taps nudge -> lands in correct learning module
- signed-in user taps `Train` from Home -> sees existing dashboard content
- free user near/exceeding quota sees blocking message and paywall path
- category-switch flow clears stale result and generates a fresh prompt in the new category

### Regression checks

- onboarding gate still appears for incomplete users
- profile tab still works
- daily quest and module progression still work from Train screen
- existing paywall flow remains unchanged

## Assumptions And Defaults

- Naming is locked to `Train` and `Generate`.
- Scope is MVP shipping plan, not full v1.
- Access is signed-in utility with free quotas.
- Home becomes a simple switchboard; the old dashboard moves to `Train`.
- Generate outputs prompts only, not final images/code/copy artifacts.
- MVP uses one server action for both initial generation and refinement.
- MVP does not add history, favorites, or vendor-specific prompt formatting.
- Training funnel uses direct module deep links after copy instead of a more complex recommendation layer.
- Keep existing quota numbers and existing Pro value mostly quota-based for this release.

## Phase 2 Follow-Up

After MVP ships and metrics are available, the next planned additions should be:

1. platform-specific prompt variants
2. stronger Pro differentiation inside Generate
3. saved prompt history and recents
4. notification loops tied to Generate activity
5. personalized “learn the pattern behind what you generated” messaging
