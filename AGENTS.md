# AI Agent Instructions

## Project Overview

This is the **Prompt Pal App** frontend. The backend is available at:
- **Development**: http://10.122.197.204:3000
- **Production**: https://ai-proxy-backend-psi.vercel.app/

## Key Documentation

Before making changes, always consult these documents:

1. **Product Requirements**: `docs/prd.md` - The PRD containing feature specifications and requirements
2. **Planning Phases**: `phases/` folder - Contains different phases of the project planning
3. **Codebase Map**: `codebase_map.md` - Architecture overview and data flow documentation
4. **API Documentation**: `api_docs.md` - Backend API endpoints and usage

## Development Guidelines

- Follow existing code patterns and conventions
- Check the codebase map before making architectural changes
- Ensure frontend changes align with the backend API specs
- Refer to the PRD for feature requirements and acceptance criteria

## Cursor Cloud specific instructions

### Project Structure

The Expo/React Native app lives in `PromptPal/`. All development commands must be run from that directory.

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Expo Dev Server (web) | `npx expo start --web` | Serves on port 8081 by default |
| TypeScript check | `npx tsc --noEmit` | Pre-existing errors in legacy `src/lib/gemini.ts` |
| Jest tests | `npx jest` | Pre-existing failures in some test suites |
| Web build | `npx expo export --platform web` | Outputs to `dist/` |

### Standard commands

See `PromptPal/README.md` and `PromptPal/package.json` scripts for full command reference.

### Known issues (pre-existing)

- **Web mode `import.meta` error**: Zustand 5.x ships ESM with `import.meta.env` in `zustand/esm/middleware.mjs`. Metro's web bundler emits a non-module `<script>` tag, causing `SyntaxError: Cannot use 'import.meta' outside a module` at runtime. The dev server starts and bundles successfully (HTTP 200), but the browser cannot execute the JS. This does **not** affect native iOS/Android builds (which use the CJS export via the `react-native` condition).
- **TypeScript**: `src/lib/gemini.ts` has syntax errors (legacy file from before the Convex migration).
- **Jest**: Some test suites fail due to React Native 0.81 mocking issues and missing `detox` dependency for e2e tests.

### Environment variables

Copy `PromptPal/.env.example` to `PromptPal/.env` and fill in Convex/Clerk credentials. Required vars: `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`. Without real credentials, the app will not render auth screens.

### Gotchas

- This is primarily a **mobile app** (React Native). Web mode (`expo start --web`) is secondary and has the `import.meta` compatibility issue noted above.
- The `npm run lint` script referenced in README does not exist in `package.json`. Use `npx tsc --noEmit` for type checking instead.
- There is no ESLint config file; linting is limited to TypeScript type checking.
