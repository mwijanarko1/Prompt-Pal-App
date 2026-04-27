# PromptPal Master Plan

Single source of truth for all remaining phase and plan work.

## Phase 4: Content and Level System

- [ ] Confirm intermediate and advanced level coverage is complete for code and copy modules.
- [ ] Validate level metadata consistency (difficulty, passing score, hints, tags, points).
- [ ] Verify level unlock/progression behavior across all modules.

## Phase 5: Gameplay UI and Experience

- [ ] Implement `src/features/levels/components/LevelCard.tsx`.
- [ ] Implement `src/features/levels/components/LevelGrid.tsx`.
- [ ] Implement `src/features/levels/components/LevelFilters.tsx`.
- [ ] Implement `src/features/game/components/LoadingTerminal.tsx`.
- [ ] Verify next-level navigation consistency after completion flows.
- [ ] Review game result surfaces for clear score/feedback presentation.

## Phase 6: Polish, Validation, and Release

- [ ] Run end-to-end regression on iOS (quests, coding, copywriting, progression).
- [ ] Run end-to-end regression on Android (quests, coding, copywriting, progression).
- [ ] Fix high-severity issues found in regression testing.
- [ ] Complete performance pass (list rendering, media loading, avoid unnecessary re-renders).
- [ ] Finalize release documentation (MVP features, known limitations, user guidance).

## Onboarding Completion Checklist

- [ ] Confirm onboarding route is fully wired from auth entry to main app handoff.
- [ ] Validate onboarding accessibility (screen reader labels, focus order, reduced motion).
- [ ] Verify onboarding persistence/re-entry behavior after app restart.
- [ ] Run onboarding QA on iOS and Android devices.

## Platform Stability and Runtime Checklist

- [ ] Remove any remaining isolation-only safe-mode scaffolding if still present.
- [ ] Verify cold start and tab switching stability on production-like builds.
- [ ] Validate auth startup flow does not show unintended route animations.
- [ ] Verify theme/colors are correct across launch, auth, tabs, and game routes.