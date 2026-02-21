# TODO

## Plan
- [x] Implement a SAFE_MODE bootstrap that avoids loading Clerk/Convex/Sync/usage code
- [x] Add a minimal safe-mode screen and route guard to prevent redirects
- [x] Add an EAS build profile (or env flag) to enable SAFE_MODE for isolation
- [x] Add staged boot modes for Clerk-only and Convex-only
- [x] Add staged boot modes for GestureHandler and Router-only
- [x] Ship a SAFE_MODE build and confirm whether it launches
- [x] Re-enable subsystems one by one to identify the crashing module
- [x] Apply RNGH entry import fix and rebuild gesture mode
 
## Local Build Plan
- [x] Ensure fastlane is available on PATH for local builds
- [x] Address Node version mismatch if it blocks local build
- [x] Run local iOS build for `gesture` profile

## Review
- [x] Confirm SAFE_MODE build does not crash on launch
- [x] Identify the first subsystem re-enable that reintroduces the crash (GestureHandlerRootView)

## React Version Fix Plan
- [x] Parse device logs to identify first fatal JS exception
- [x] Confirm React/renderer mismatch (`react` 19.2.4 vs `react-native-renderer` 19.1.0)
- [x] Pin React family dependencies to 19.1.0-compatible versions
- [x] Reinstall dependencies and regenerate lockfile
- [x] Rebuild local iOS `gesture` profile and verify launch

## React Version Fix Review
- [ ] Confirm runtime no longer throws React version mismatch at startup
