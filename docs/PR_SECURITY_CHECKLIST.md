# PR Security Checklist

Use this checklist before pushing changes and opening a PR to ensure credentials and secrets are handled safely.

## ✅ Before You Push

### 1. No secrets in code or docs
- [ ] **No API keys, passwords, or tokens** are hardcoded in source (`.ts`, `.tsx`, `.js`, `.json`).
- [ ] **No real values** in docs: only placeholders (e.g. `pk_test_...`, `https://your-project.convex.cloud`).
- [ ] **No `.env` or `.env.local`** are committed; they are listed in `.gitignore` (root and `PromptPal/`).

### 2. Environment variables
- [ ] **Client (Expo)** uses only `EXPO_PUBLIC_*` vars from `.env` (e.g. `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`). These are safe to be public.
- [ ] **Convex backend** secrets (`GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `CLERK_JWT_ISSUER_DOMAIN`) are set in **Convex Dashboard** → Settings → Environment Variables, **not** in the repo.
- [ ] **`.env.example`** contains only placeholder values and no real keys.

### 3. Logging and debugging
- [ ] **No `console.log` of env values** that could contain secrets (see `src/lib/env.ts`: we log only `SET`/`MISSING`, never the value).
- [ ] **No logging of JWTs, tokens, or passwords** anywhere.

### 4. Auth and tokens
- [ ] **Clerk**: Only the **publishable** key is in the app; the **secret** key is never in client code or repo.
- [ ] **Convex HTTP client** uses Clerk’s JWT via `getToken({ template: 'convex' })`; tokens are not stored in plain text.
- [ ] **Sensitive operations** (game state, usage, stats) require auth; Convex handlers check `ctx.auth.getUserIdentity()`.

### 5. Git
- [ ] Run `git status` and confirm **no `.env` or `.env.local`** are staged.
- [ ] If you ever committed a secret: rotate it immediately (new Clerk key, new Convex env var, etc.) and remove the secret from history if needed.

---

## Quick verification commands

From repo root:

```bash
# Ensure .env is ignored (should print a rule)
git check-ignore -v PromptPal/.env

# Search for likely secrets (should find only docs/placeholders)
# Optional: grep -r "pk_live_\|sk_\|AIza" --include="*.ts" --include="*.tsx" PromptPal/src
# Expect: no matches in source
```

---

## Reference: what goes where

| Item | Where it lives | In repo? |
|------|----------------|----------|
| `EXPO_PUBLIC_CONVEX_URL` | `.env` (local) | No (gitignored) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `.env` (local) | No (gitignored) |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex Dashboard env | No |
| `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | Convex Dashboard env | No |
| Clerk secret key | Clerk Dashboard only | Never in app or repo |

---

**Last updated**: February 2026
