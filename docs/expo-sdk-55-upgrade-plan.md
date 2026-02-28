# Expo SDK 55 Upgrade Plan

**Date**: February 28, 2026
**Current SDK**: 54 (Expo ~54.0.33, React Native 0.81.5, React 19.1.0)
**Target SDK**: 55 (Expo ~55.0.0, React Native 0.83.2, React 19.2)

---

## 1. Summary of SDK 55 Breaking Changes

| Change | Impact on PromptPal | Action Required |
|--------|---------------------|-----------------|
| Legacy Architecture removed | `newArchEnabled` in `app.json` is now ignored/deprecated | Remove `newArchEnabled` from `app.json` |
| React Native 0.81 → 0.83 | Core framework upgrade | Update `react-native` version |
| React 19.1 → 19.2 | Minor React version bump | Update `react` and `react-dom` |
| `expo-av` removed | Sound module references `expo-av` in comments (not imported) | Update comments to reference `expo-audio` |
| Android API level 36 / iOS 15.1+ / Xcode 16.1+ | Platform requirements | No code changes needed; CI/EAS already compatible |
| Hermes v1 opt-in available | Optional performance improvement | Document; do not adopt yet |

---

## 2. File-by-File Changes

### 2.1 `app.json`

- **Remove `"newArchEnabled": true`** — SDK 55 only supports New Architecture, so this flag is obsolete and will produce a warning if left in.

### 2.2 `package.json` — Dependency Updates

#### Core Expo packages (use `npx expo install --fix` after bumping `expo`)

| Package | Current | Target (SDK 55) | Notes |
|---------|---------|-----------------|-------|
| `expo` | `~54.0.33` | `~55.0.0` | Core SDK |
| `react` | `19.1.0` | `19.2.0` | Peer of SDK 55 |
| `react-dom` | `19.1.0` | `19.2.0` | Web support |
| `react-native` | `0.81.5` | `0.83.2` | Core RN |
| `expo-asset` | `~12.0.12` | SDK 55 compatible | `npx expo install --fix` |
| `expo-auth-session` | `~7.0.10` | SDK 55 compatible | `npx expo install --fix` |
| `expo-clipboard` | `~8.0.8` | SDK 55 compatible | `npx expo install --fix` |
| `expo-constants` | `~18.0.13` | SDK 55 compatible | `npx expo install --fix` |
| `expo-haptics` | `~15.0.8` | SDK 55 compatible | `npx expo install --fix` |
| `expo-image` | `~3.0.11` | SDK 55 compatible | `npx expo install --fix` |
| `expo-linking` | `~8.0.11` | SDK 55 compatible | `npx expo install --fix` |
| `expo-router` | `~6.0.23` | SDK 55 compatible | `npx expo install --fix` |
| `expo-secure-store` | `~15.0.8` | SDK 55 compatible | `npx expo install --fix` |
| `expo-status-bar` | `~3.0.9` | SDK 55 compatible | `npx expo install --fix` |
| `expo-web-browser` | `~15.0.10` | SDK 55 compatible | `npx expo install --fix` |

#### React Native ecosystem packages

| Package | Current | Action |
|---------|---------|--------|
| `react-native-gesture-handler` | `~2.28.0` | `npx expo install --fix` |
| `react-native-reanimated` | `~4.1.1` | `npx expo install --fix` |
| `react-native-safe-area-context` | `~5.6.2` | `npx expo install --fix` |
| `react-native-screens` | `~4.16.0` | `npx expo install --fix` |
| `react-native-svg` | `15.12.1` | `npx expo install --fix` |
| `react-native-web` | `^0.21.2` | `npx expo install --fix` |
| `react-native-worklets` | `0.5.1` | `npx expo install --fix` |
| `react-native-css-interop` | `^0.2.1` | Check NativeWind compat |
| `@shopify/flash-list` | `2.0.2` | `npx expo install --fix` |
| `@react-native-community/netinfo` | `^11.4.1` | `npx expo install --fix` |

#### Third-party packages (no Expo-managed versions)

| Package | Current | Action |
|---------|---------|--------|
| `nativewind` | `^4.2.1` | Verify compat with RN 0.83; keep ≥ 4.2.1 |
| `tailwindcss` | `^3.4.19` | No change expected |
| `@clerk/clerk-expo` | `^2.19.18` | Supports React 19.2; run `npm update` |
| `convex` | `^1.31.7` | No known SDK 55 issues; run `npm update` |
| `zustand` | `^5.0.10` | No change needed |
| `axios` / `axios-retry` | Current | No change needed |
| `zod` | `^4.3.6` | No change needed |
| `ai` / `@ai-sdk/google` | Current | No change needed |

#### Dev dependencies

| Package | Current | Action |
|---------|---------|--------|
| `react-test-renderer` | `19.1.0` | Update to `19.2.0` to match React |
| `@types/react` | `~19.1.10` | Update to match React 19.2 types |
| `typescript` | `~5.9.3` | No change expected |
| `jest` | `~29.7.0` | No change needed |
| `@testing-library/react-native` | `^13.3.3` | Check RN 0.83 compat |

### 2.3 `babel.config.js`

- **No changes required.** The current config already uses `react-native-reanimated/plugin` without a separate `react-native-worklets/plugin` entry, which is correct for Reanimated v4+.

### 2.4 `tsconfig.json`

- **No changes required.** The `extends` field uses `./node_modules/expo/tsconfig.base` which auto-updates with the Expo SDK version.

### 2.5 `src/lib/sound.ts`

- **Update comments** referencing `expo-av` to reference `expo-audio` instead, since `expo-av` is removed in SDK 55 and `expo-audio` is its replacement.

### 2.6 `eas.json`

- **No changes required** for the upgrade itself. The Node.js version (`20.19.4`) and EAS CLI version (`>= 14.0.0`) are compatible with SDK 55.

---

## 3. Upgrade Procedure

1. **Create feature branch** for the upgrade
2. **Bump Expo SDK**: change `expo` to `~55.0.0` in `package.json`
3. **Run `npx expo install --fix`** to auto-resolve all Expo-managed package versions
4. **Manually update** `react`, `react-dom`, `react-test-renderer` to `19.2.0`
5. **Remove `newArchEnabled`** from `app.json`
6. **Update `sound.ts` comments** (`expo-av` → `expo-audio`)
7. **Run `npm install`** to regenerate lockfile
8. **Run `npx expo-doctor`** to validate all package versions
9. **Run `npx tsc --noEmit`** for TypeScript verification
10. **Run `npx jest`** to check test suite
11. **Run `npx expo start --web`** to verify dev server starts

---

## 4. Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| NativeWind incompatibility with RN 0.83 | Low | NativeWind 4.2.1+ patches exist; verify after install |
| Clerk SDK peer dep warnings for React 19.2 | Medium | Already seen with React 19.1; should resolve with latest Clerk version |
| Zustand ESM `import.meta` web issue persists | High | Pre-existing issue; unrelated to SDK upgrade |
| Jest test failures | Low | Pre-existing failures; SDK upgrade unlikely to introduce new ones |
| react-native-css-interop compat | Low | Tied to NativeWind; verify together |

---

## 5. Post-Upgrade Verification Checklist

- [ ] `npx expo-doctor` passes with no errors
- [ ] `npx tsc --noEmit` produces same or fewer errors than before
- [ ] `npx jest` runs (pre-existing failures acceptable)
- [ ] `npx expo start --web` bundles and serves HTTP 200
- [ ] `npx expo export --platform web` builds successfully
- [ ] No new peer dependency warnings in `npm install` output
- [ ] `app.json` no longer contains `newArchEnabled`

---

## 6. Items NOT Changing

- **Convex backend** (`convex/` directory) — no SDK 55 impact
- **Clerk auth flow** — React 19.2 is supported
- **NativeWind/Tailwind styling** — NativeWind 4.2.1+ handles Reanimated v4
- **Zustand state management** — no version change needed
- **Project structure** — keeping current `src/` structure (not adopting new SDK 55 template)
