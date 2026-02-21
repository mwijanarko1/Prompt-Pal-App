# Safe Mode Isolation Plan

Goal: Identify the native module or startup path causing the immediate TestFlight crash by shipping a minimal SAFE_MODE build and re‑enabling subsystems one by one.

## Build Strategy
1. Build A (SAFE_MODE only)
   - App boots to a minimal screen.
   - No Clerk, Convex, Sync, SecureStore, or gesture handler.
   - If this still crashes, the issue is a core native dependency (e.g. Reanimated/New Arch/Gesture Handler).

2. Build B (enable one subsystem)
   - Re-enable Clerk only using `EXPO_PUBLIC_BOOT_MODE=clerk`.
   - If it crashes, Clerk or its native deps are the culprit.

3. Build C (enable next subsystem)
   - Re-enable Convex providers using `EXPO_PUBLIC_BOOT_MODE=convex`.

4. Build D (gesture handler only)
   - Enable `EXPO_PUBLIC_BOOT_MODE=gesture`.
   - If this crashes, the issue is in GestureHandler native setup.

5. Build E (router only)
   - Enable `EXPO_PUBLIC_BOOT_MODE=router`.
   - If this crashes, the issue is in Expo Router/Stack boot.

4. Build D (enable background sync + network listeners)

Stop as soon as the crash reappears, then fix that subsystem.

## SAFE_MODE switch
- Controlled via `EXPO_PUBLIC_SAFE_MODE=1` in EAS build profile.
- Additional modes via `EXPO_PUBLIC_BOOT_MODE=gesture|router|clerk|convex|full`.

## Expected build count
- Minimum: 2 builds
- Typical: 2–3 builds
- Worst case: 4–6 builds
