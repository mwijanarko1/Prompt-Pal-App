# AI Developer Knowledge Base

This document serves as the comprehensive reference for AI agents acting as software engineers. It aggregates guidelines for behavior, coding standards, architecture, and specific technology stacks.

---

# 1. AI Interaction & Workflow

## AI Behavior & Vibe Coding Safeguards

### Business Logic & "Math"
- **Server-Side Calculation:** NEVER calculate financial data, prices, scores, or permissions on the client.
  - Bad: `const total = cart.reduce((a, b) => a + b.price, 0)` in a React component.
  - Good: Send product IDs to the server; server calculates total based on DB prices.
- **Trustless Client:** Assume the client code has been modified by the user. Do not rely on `disabled={true}` or hidden UI elements to prevent actions.

### Premium & Feature Gating
- **Withhold, Don't Hide:** Do not just hide "Premium" buttons or routes. The API/Server Action must strictly return a `403 Forbidden` or empty data if the user lacks the specific entitlement.
- **Verification:** Never trust a client-side boolean (e.g., `user.isPremium`) for sensitive operations. Re-verify subscription status on the server immediately before delivering content or performing an action.

### Database Access (Anti-Pattern)
- **No Direct Client-to-DB:** Even if using Supabase/Firebase, DO NOT write data directly from the frontend using client SDKs in `useEffect` or event handlers.
- **Middleware Requirement:** Always route data mutations through a "Middleware" layer (Next.js API Routes, Server Actions, or Edge Functions) to ensure validation and rate limiting run in a trusted environment.

### Operational Protocols
- **Manual Trigger Strategy:** Do not run `npm run dev` or `npm start`. Wait for specific user instructions before starting any server.
- **Permission Protocol:** Ask for consent before running any command in the terminal.
- **Process Management:** Avoid starting long-running or background processes. Keep the terminal available for the user.

## Output Format (for Code Reviews/Audits)

Group findings by file. Use `file:line` format (VS Code clickable). Terse findings.

```text
## src/Button.tsx

src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:18 - input lacks label
src/Button.tsx:55 - animation missing prefers-reduced-motion
src/Button.tsx:67 - transition: all → list properties

## src/Modal.tsx

src/Modal.tsx:12 - missing overscroll-behavior: contain
src/Modal.tsx:34 - "..." → "…"
```

## Version Control Guidelines

### Branching Strategy
- **Flow:** Adopt **GitHub Flow** (Trunk-Based Development).
  - `main`: Production-ready state. Deployable at any time.
  - `feature/`: New features (e.g., `feature/auth-login`).
  - `fix/`: Bug fixes (e.g., `fix/header-alignment`).
  - `chore/`: Maintenance, config, dependency updates.
- **Naming:**
  - Use lowercase kebab-case.
  - Format: `type/short-description`.
  - Example: `feature/user-profile`, `fix/login-timeout`.

### Commit Convention
- **Standard:** Follow **Conventional Commits** (`type(scope): subject`).
- **Types:**
  - `feat`: A new feature.
  - `fix`: A bug fix.
  - `docs`: Documentation only changes.
  - `style`: Formatting, missing semi-colons (no code change).
  - `refactor`: A code change that neither fixes a bug nor adds a feature.
  - `test`: Adding missing tests or correcting existing tests.
  - `chore`: Changes to the build process or auxiliary tools.
- **Subject:**
  - Imperative mood ("Add" not "Added").
  - No capitalization of first letter.
  - No period at the end.
  - **Example:** `feat(auth): implement google oauth provider`

### Pull Requests (PRs)
- **Scope:** Limit PRs to a single logical change or feature. Large PRs (>400 lines) should be split.
- **Description:** Must answer:
  1.  **What** changed?
  2.  **Why** (context/ticket link)?
  3.  **How** to test?
- **Merge Strategy:** Use **Squash and Merge**.
  - Keeps the `main` history clean and linear.
  - Combines WIP commits into a single semantic commit.

### Workflow Rules
- **Never Push to Main:** Direct pushes to `main` are blocked. All changes require a PR.
- **Syncing:** Pull `main` into your feature branch frequently (`git pull origin main`) to resolve conflicts early, not at the end.
- **Secrets:** NEVER commit `.env` files, API keys, or credentials. Use `.gitignore`.
- **Cleanup:** Delete feature branches immediately after merging.

---

# 2. Universal Engineering Standards

## Code Quality Guidelines

### Naming Conventions
- **General:** Use English language universally.
- **Variables & Functions:** Use `camelCase`. Names must be descriptive (verb-noun).
  - Bad: `const d = ...` | `function handle()`
  - Good: `const userData = ...` | `function handleSubmit()`
- **Components:** Use `PascalCase`. Filename must match component name.
  - Example: `UserProfile.tsx` -> `export function UserProfile() {}`
- **Booleans:** Must be interrogative (`is`, `has`, `should`, `can`).
  - Example: `isVisible`, `hasAccess`, `canSubmit`.
- **Constants:** Use `UPPER_SNAKE_CASE` for values that are truly static/config.
- **Types/Interfaces:** Use `PascalCase`. Do NOT use `I` prefix (e.g., `IUser`).

### Code Style & Formatting
- **Imports:**
  - Use **Absolute Imports** (`@/components/...`) over relative paths (`../../`).
  - Order: Built-ins -> External (npm) -> Internal (Project) -> Styles.
- **Functions:**
  - Prefer **Function Declarations** (`export function Name()`) for top-level components (better for debugging/stack traces).
  - Use **Arrow Functions** for callbacks and inline handlers.
- **Conditionals:**
  - Use **Early Returns** (Guard Clauses) to avoid nested indentation ("Arrow Code").
  - Use Ternaries only for short, single-line logic. Avoid nested ternaries.
- **TypeScript:**
  - **Strict Mode:** No `any`. Use `unknown` or specific types.
  - **Inference:** Allow TS to infer return types for simple functions; explicit return types for exports/APIs.

### Documentation
- **Philosophy:** Code should be self-documenting. Clear variable names > comments.
- **When to Comment:**
  - Explain **"Why"** a decision was made, not **"What"** the code is doing.
  - Mark workarounds for specific browser bugs or API quirks.
- **JSDoc:** Mandatory for shared utilities and complex business logic functions. Include `@param` and `@returns` descriptions.
- **TODOs:** Format as `// TODO(username): Description` so they can be tracked.

### Modularity & Structure
- **Single Responsibility:** A component should do one thing. If a file exceeds ~250 lines, refactor sub-components or logic into hooks.
- **Logic Extraction:**
  - Move complex `useEffect` or state logic into custom hooks (`useFeatureLogic.ts`).
  - Keep JSX clean and declarative.
- **Magic Values:**
  - No hardcoded strings or numbers in business logic. Extract to a `constants.ts` file or configuration object.
- **Colocation:** Keep related styles, tests, and types close to the component, not in far-away folders.

## Security Guidelines

### Input Validation & Sanitization
- **Strict Validation:** Treat all input (Body, Query Params, Headers, Cookies) as untrusted.
- **Schema-First:** Use **Zod** schemas to parse and validate every incoming request before processing logic. Reject unknown fields (`.strict()`).
- **Type Casting:** Do not blindly cast user input to internal types. Explicitly parse and transform.
- **Output Encoding:** Use framework-native rendering (React `{variable}`) to prevent XSS. Explicitly sanitize HTML with `dompurify` if `dangerouslySetInnerHTML` is unavoidable.
- **File Uploads:**
  - Validate MIME types (using magic numbers, not extensions).
  - Enforce strict size limits.
  - Store uploaded files outside the web root (e.g., S3 private bucket).

### Data Encryption
- **Data in Transit:** Enforce TLS 1.2+ (HTTPS) everywhere. Set `Strict-Transport-Security` (HSTS) headers (max-age=63072000; includeSubDomains; preload).
- **Data at Rest:**
  - Encrypt database volumes and backups.
  - Hash passwords using **Argon2id** or **Bcrypt** (work factor > 10).
- **Sensitive Fields:** Encrypt PII (SSN, API keys) at the application layer before DB insertion using AES-256-GCM.
- **Key Management:** Rotate encryption keys regularly. Never commit keys to version control.

### OWASP Top 10 Mitigation
- **A01: Broken Access Control:** Gatekeep every endpoint. Checking "isLoggedIn" is not enough; check "hasPermissionForThisSpecificResource". Withhold data on the server; do not rely on frontend UI hiding.
- **A02: Cryptographic Failures:** Do not roll custom crypto. Use standard libraries (`crypto` module, `bcrypt`).
- **A03: Injection:**
  - **SQL:** Use Parameterized Queries (Prepared Statements) or an ORM (Prisma/Drizzle) exclusively. No string concatenation.
  - **Command:** Avoid `exec()`. If necessary, validate arguments against a strict allowlist.
- **A05: Security Misconfiguration:**
  - Remove default accounts/pages.
  - Disable detailed error messages/stack traces in production.
  - Set security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
- **A07: Identification and Authentication Failures:**
  - Enforce MFA where possible.
  - Implement Rate Limiting (Token Bucket algorithm) on login/reset endpoints.
  - Prohibit weak passwords (min 12 chars, complexity check).

### Content Security Policy (CSP)
- Implement a strict CSP to mitigate XSS and Data Injection.
- **Default:** `default-src 'self';`
- **Scripts:** `script-src 'self' 'nonce-[random]';` (Avoid `'unsafe-inline'` or `'unsafe-eval'`).
- **Objects:** `object-src 'none';`
- **Base URI:** `base-uri 'none';`

## Testing Guidelines

### General Philosophy
- **Confidence > Coverage:** Focus on testing critical business logic and user journeys rather than chasing 100% meaningless code coverage.
- **The Testing Trophy:** Prioritize **Integration Tests** (most value), followed by Static Analysis (Types), Unit Tests, and finally E2E (fewest).
- **Test ID:** Use `data-testid` attributes only when semantic queries (role, label, text) fail. Prefer testing how users interact with the app.

### Unit Testing (Jest / Vitest)
- **Scope:** Pure functions, utilities, hooks, and complex algorithmic logic.
- **Isolation:** Tests must run in isolation and share no state.
- **Pattern:** Follow the AAA pattern (Arrange, Act, Assert).
- **Component Unit Tests:**
  - Test complex interaction logic (e.g., custom hooks).
  - Avoid shallow rendering; render the full component tree where possible.
  - Do NOT test implementation details (e.g., "state is X"); test outputs (e.g., "button is disabled").

### Integration Testing (React Testing Library)
- **Scope:** Feature flows, form submissions, interactions between components and stores.
- **Behavior-Driven:** Simulate user events (`userEvent.click`, `userEvent.type`) rather than triggering handlers manually.
- **API Boundaries:**
  - Mock external API calls using **MSW (Mock Service Worker)** at the network level.
  - Do not mock fetch/axios implementation directly.
- **Database:** For server-side integration tests, use a dedicated test database container (Docker) reset between runs.

### End-to-End (E2E) Testing (Playwright / Cypress)
- **Scope:** Critical Happy Paths (Signup, Checkout, Core Feature usage) and Smoke Tests.
- **Environment:** Run against a production-like build, not the dev server.
- **Data:**
  - Seed the database with known test data before runs.
  - Clean up data after execution.
- **Resilience:** Avoid hard-coded waits (`wait(5000)`). Use assertion retries (e.g., `await expect(ui).toBeVisible()`).
- **Visual Regression:** Use snapshot testing sparingly, focused on complex layouts that break easily.

### Mocking Strategy
- **External Services:** ALWAYS mock 3rd party APIs (Stripe, OpenAI, Email Providers) to prevent flakiness and cost.
- **Internal Modules:** Avoid mocking internal functions unless absolutely necessary (e.g., current time, random number generators).
- **Date/Time:** Freeze system time in tests to ensure deterministic results.
- **Database:** Prefer an in-memory DB or Dockerized test DB over mocking ORM calls, to catch SQL/Schema errors.

---

# 3. Web & Frontend Stack

## Project Setup Guidelines

### Directory Structure (Next.js App Router)
Enforce `src/` directory. Use Feature-First (Screaming) Architecture to colocate related logic.

```text
src/
├── app/                 # Next.js App Router (Routes & Layouts ONLY)
│   ├── (auth)/          # Route groups for organization
│   ├── api/             # API routes
│   └── layout.tsx
├── features/            # Business Logic (Domain-driven)
│   ├── [feature-name]/
│   │   ├── components/  # Feature-specific components
│   │   ├── hooks/       # Feature-specific hooks
│   │   ├── services/    # Data fetching/Server Actions
│   │   └── types/       # Feature-specific types
├── components/          # Shared/Generic Components
│   ├── ui/              # ShadCN primitives (buttons, inputs)
│   └── layout/          # Global layout (nav, footer)
├── lib/                 # Shared Utilities
│   ├── db.ts            # DB connection
│   └── utils.ts         # Helper functions
├── types/               # Global TypeScript definitions
└── env/                 # Environment validation schemas
```

### Dependency Management
- **Package Manager:** Use `npm` or `pnpm` consistently.
- **Lockfile:** Always commit `package-lock.json` or `pnpm-lock.yaml`.
- **Versioning:**
  - Pin exact versions for core deps (remove `^` or `~`).
  - Use semantic versioning for utilities.
- **Vetting:**
  - Prefer packages with >1k stars and recent updates.
  - Audit size with `bundle-phobia` before adding.
- **Separation:** Strictly separate `dependencies` vs `devDependencies`.

### Environment Variables
- **Validation:** Use Zod or T3 Env to validate all env vars at build/runtime.
- **Template:** Maintain an up-to-date `.env.example` with dummy values.
- **Naming:**
  - Server-only: `DB_PASSWORD`, `API_SECRET`
  - Client-exposed: `NEXT_PUBLIC_API_URL`
- **Security:**
  - Never commit `.env` files.
  - Add `.env*` to `.gitignore` (except `.env.example`).

## Frontend Development Guidelines

### UI/UX Principles
- **Mobile-First Design:** Implement styles for mobile viewports first, then use `sm:`, `md:`, `lg:` breakpoints for larger screens.
- **Feedback Loops:** Provide immediate visual feedback for all interactions.
  - *Active:* Button press states.
  - *Loading:* Skeleton loaders (ShadCN `Skeleton`) preferred over spinners for initial page loads.
  - *Outcome:* Toast notifications (`sonner`/`toast`) for success/error events.
- **Layout Stability:** Prevent Cumulative Layout Shift (CLS) by defining explicit dimensions for images and reserving space for async content.
- **Touch Targets:** Ensure interactive elements are at least 44x44px for mobile accessibility.

### Accessibility (A11y)
- **Standard:** Target WCAG 2.1 Level AA compliance.
- **Semantic HTML:** Use native elements (`<button>`, `<a>`, `<input>`) over `div` soups. Never use `onClick` on non-interactive elements without `role` and `tabIndex`.
- **Keyboard Navigation:** Ensure visible focus states (`ring-offset`, `focus-visible`) on all interactive elements. No keyboard traps.
- **Screen Readers:**
  - Use `aria-label` for icon-only buttons.
  - Ensure form inputs have associated `<label>` elements.
  - Use `sr-only` class for text that should be hidden visually but available to screen readers.
- **Color Contrast:** Verify text/background ratios meet 4.5:1 standard.

### State Management
- **URL as Source of Truth:** Store filter, pagination, and sort parameters in the URL (`searchParams`) rather than local state to enable shareable/bookmarkable links.
- **Server vs. Client:**
  - Prefer Server Components for fetching.
  - Use `React Query` (or equivalent) only if polling or client-side caching is strictly necessary.
- **Local State:** Use `useState` for simple, ephemeral UI state (modals, inputs).
- **Zustand/Context:** Reserve for truly global app state (user preferences, authentication tokens). Avoid "Context Hell."

### Component Reusability
- **Atomic Design:** Build from primitives (Buttons, Inputs) -> Molecules (Form Groups) -> Organisms (Tables, Cards).
- **Styling Composition:**
  - Use `clsx` and `tailwind-merge` (`cn()` utility) to allow parent components to safely override/extend child styles.
  - Avoid hardcoding margins/positioning on the component itself; let the parent control layout.
- **Variant Management:** Use `class-variance-authority` (CVA) to define type-safe component variants (e.g., `variant="outline"`, `size="sm"`).
- **Slot Pattern:** Use `Radix UI` Slot primitive (via ShadCN `asChild`) to allow components to change their underlying HTML tag (polymorphism) while maintaining styles.

## Web Interface Guidelines (Detailed)

### Accessibility
- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Interactive elements need keyboard handlers (`onKeyDown`/`onKeyUp`)
- `<button>` for actions, `<a>`/`<Link>` for navigation (not `<div onClick>`)
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates (toasts, validation) need `aria-live="polite"`
- Use semantic HTML (`<button>`, `<a>`, `<label>`, `<table>`) before ARIA
- Headings hierarchical `<h1>`–`<h6>`; include skip link for main content
- `scroll-margin-top` on heading anchors

### Focus States
- Interactive elements need visible focus: `focus-visible:ring-*` or equivalent
- Never `outline-none` / `outline: none` without focus replacement
- Use `:focus-visible` over `:focus` (avoid focus ring on click)
- Group focus with `:focus-within` for compound controls

### Forms
- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste (`onPaste` + `preventDefault`)
- Labels clickable (`htmlFor` or wrapping control)
- Disable spellcheck on emails, codes, usernames (`spellCheck={false}`)
- Checkboxes/radios: label + control share single hit target (no dead zones)
- Submit button stays enabled until request starts; spinner during request
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern
- `autocomplete="off"` on non-auth fields to avoid password manager triggers
- Warn before navigation with unsaved changes (`beforeunload` or router guard)

### Animation
- Honor `prefers-reduced-motion` (provide reduced variant or disable)
- Animate `transform`/`opacity` only (compositor-friendly)
- Never `transition: all`—list properties explicitly
- Set correct `transform-origin`
- SVG: transforms on `<g>` wrapper with `transform-box: fill-box; transform-origin: center`
- Animations interruptible—respond to user input mid-animation

### Typography
- `…` not `...`
- Curly quotes `"` `"` not straight `"`
- Non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names
- Loading states end with `…`: `"Loading…"`, `"Saving…"`
- `font-variant-numeric: tabular-nums` for number columns/comparisons
- Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)

### Content Handling
- Text containers handle long content: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` to allow text truncation
- Handle empty states—don't render broken UI for empty strings/arrays
- User-generated content: anticipate short, average, and very long inputs

### Images
- `<img>` needs explicit `width` and `height` (prevents CLS)
- Below-fold images: `loading="lazy"`
- Above-fold critical images: `priority` or `fetchpriority="high"`

### Performance & Hydration
- **Performance:**
  - Large lists (>50 items): virtualize (`virtua`, `content-visibility: auto`)
  - No layout reads in render (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`)
  - Batch DOM reads/writes; avoid interleaving
  - Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke
  - Add `<link rel="preconnect">` for CDN/asset domains
  - Critical fonts: `<link rel="preload" as="font">` with `font-display: swap`
- **Hydration Safety:**
  - Inputs with `value` need `onChange` (or use `defaultValue` for uncontrolled)
  - Date/time rendering: guard against hydration mismatch (server vs client)
  - `suppressHydrationWarning` only where truly needed

### Navigation & State
- URL reflects state—filters, tabs, pagination, expanded panels in query params
- Links use `<a>`/`<Link>` (Cmd/Ctrl+click, middle-click support)
- Deep-link all stateful UI (if uses `useState`, consider URL sync via nuqs or similar)
- Destructive actions need confirmation modal or undo window—never immediate

### Touch & Interaction
- `touch-action: manipulation` (prevents double-tap zoom delay)
- `-webkit-tap-highlight-color` set intentionally
- `overscroll-behavior: contain` in modals/drawers/sheets
- During drag: disable text selection, `inert` on dragged elements
- `autoFocus` sparingly—desktop only, single primary input; avoid on mobile

### Safe Areas & Layout
- Full-bleed layouts need `env(safe-area-inset-*)` for notches
- Avoid unwanted scrollbars: `overflow-x-hidden` on containers, fix content overflow
- Flex/grid over JS measurement for layout

### Dark Mode & Theming
- `color-scheme: dark` on `<html>` for dark themes (fixes scrollbar, inputs)
- `<meta name="theme-color">` matches page background
- Native `<select>`: explicit `background-color` and `color` (Windows dark mode)

### Locale & i18n
- Dates/times: use `Intl.DateTimeFormat` not hardcoded formats
- Numbers/currency: use `Intl.NumberFormat` not hardcoded formats
- Detect language via `Accept-Language` / `navigator.languages`, not IP

### Content & Copy
- Active voice: "Install the CLI" not "The CLI will be installed"
- Title Case for headings/buttons (Chicago style)
- Numerals for counts: "8 deployments" not "eight"
- Specific button labels: "Save API Key" not "Continue"
- Error messages include fix/next step, not just problem
- Second person; avoid first person
- `&` over "and" where space-constrained

### Anti-patterns (flag these)
- `user-scalable=no` or `maximum-scale=1` disabling zoom
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` without focus-visible replacement
- Inline `onClick` navigation without `<a>`
- `<div>` or `<span>` with click handlers (should be `<button>`)
- Images without dimensions
- Large arrays `.map()` without virtualization
- Form inputs without labels
- Icon buttons without `aria-label`
- Hardcoded date/number formats (use `Intl.*`)
- `autoFocus` without clear justification

## Performance Optimization Guidelines

### Asset Loading & Bundle Size
- **Images:**
  - Mandate `next/image` for automatic optimization (WebP/AVIF conversion).
  - Explicitly set `width` and `height` (or `fill` with parent aspect ratio) to prevent Layout Shifts (CLS).
  - Set `priority={true}` ONLY for the Largest Contentful Paint (LCP) element (e.g., hero image); lazy load all others.
- **Code Splitting:**
  - Use `next/dynamic` to lazy load heavy components (charts, maps, rich text editors) that are below the fold.
  - Implement Route-based code splitting (default in Next.js).
- **Fonts:**
  - Use `next/font` to host fonts locally at build time.
  - Enforce `display: swap` or `optional` to prevent blocking text rendering.
- **Scripts:**
  - Use `next/script` with appropriate strategies (`lazyOnload` for analytics, `worker` for heavy computations).

### Caching Strategy
- **Hierarchy:**
  1. **Browser/CDN:** Use `Cache-Control` headers. Implement `stale-while-revalidate` for high-availability content.
  2. **Next.js Data Cache:** Memoize fetch requests. Use `revalidateTag` (On-Demand Revalidation) over time-based revalidation for cleaner data consistency.
  3. **Memoization:** Deduplicate identical fetch requests within a single render pass using React `cache()`.
- **Database Caching:** Implement a Redis/KV layer for expensive aggregation queries that update infrequently.
- **Static vs Dynamic:** Prefer Static Site Generation (SSG/ISR) for marketing pages. Use Partial Prerendering (PPR) where applicable.

### Database Query Optimization
- **N+1 Prevention:**
  - Strictly prohibit N+1 query patterns. Use `JOIN`s, `include` (ORM), or Dataloader patterns to batch requests.
- **Selectivity:**
  - Ban `SELECT *`. Explicitly select only required columns to reduce network payload and memory usage.
- **Indexing:**
  - Enforce indexes on all columns used in `WHERE`, `ORDER BY`, and Foreign Key joins.
  - Review `EXPLAIN ANALYZE` output for any query taking >100ms.
- **Pagination:**
  - Implement Cursor-based pagination (keyset) for infinite scroll or large datasets (performance O(1)).
  - Avoid Offset-based pagination for tables with >10k rows (performance O(N)).
- **Connection Pooling:** Ensure a connection pooler (e.g., PgBouncer) is configured for serverless environments to prevent connection exhaustion.

---

# 4. Backend & Architecture

## Architecture Guidelines

### Component Design
- **Server-First Strategy:** Default to React Server Components (RSC) for data fetching. Use Client Components (`'use client'`) only for interactivity or browser APIs.
- **Composition over Inheritance:** Use `children` prop and slots to avoid deep prop drilling and "God Components."
- **Presentational vs. Container:**
  - *Presentational:* Stateless, UI-only, receives data via props.
  - *Container:* Manages state, fetches data, passes to Presentational.
- **Strict Interfaces:** Define TypeScript interfaces for all props. Export interfaces from the component file.
- **Headless UI:** Decouple logic from rendering. Use hooks for complex behavior (e.g., `useToggle`, `useForm`) to keep JSX clean.
- **Error Boundaries:** Wrap feature roots in Error Boundaries to prevent full app crashes.

### Data Flow
- **Unidirectional:** Data flows down (Props), events flow up (Callbacks).
- **Source of Truth Hierarchy:**
  1. **URL State:** (Search params, dynamic routes) for shareable state.
  2. **Server State:** (React Query/SWR) for async data.
  3. **Local State:** (`useState`/`useReducer`) for UI interaction.
  4. **Global State:** (Zustand/Context) ONLY for app-wide settings (theme, user session). Avoid using Redux/Context for caching server data.
- **Boundary Validation:** Validate all external data entering the system (API responses, URL params) using Zod schemas immediately at the entry point.

### API Design (RESTful)
- **Resource Oriented:** URLs represent resources (nouns), methods represent actions (verbs).
  - `GET /users` (List), `POST /users` (Create), `GET /users/:id` (Detail).
- **Service Layer Pattern:** API Routes (`route.ts`) must not contain business logic. They should validate input, call a Service/Controller function, and return a standardized response.
- **Type Safety (End-to-End):**
  - Share Types/DTOs between Client and Server.
  - Enforce Zod validation on Request Bodies and Query Params.
- **Standardized Responses:**
  - Success: `{ data: T, meta?: Meta }`
  - Error: `{ code: string, message: string, errors?: ValidationErrors }`
- **Status Codes:** Use correct semantic codes (200 OK, 201 Created, 400 Bad Request, 401 Unauth, 403 Forbidden, 422 Validation Error, 500 Server Error).

## Backend Development Guidelines

### Database Schema (Relational/SQL)
- **Naming Conventions:**
  - Tables: Plural, `snake_case` (e.g., `users`, `order_items`).
  - Columns: `snake_case` (e.g., `first_name`, `is_active`).
- **Primary Keys:** Use `UUID` (v4) or `CUID2` for ID fields to prevent enumeration attacks and assist migration. Avoid auto-incrementing integers.
- **Timestamps:** Every table must have `created_at` (default now) and `updated_at` (auto-update).
- **Integrity:** Enforce Foreign Key constraints. Define explicit `ON DELETE` behaviors (CASCADE, SET NULL, or RESTRICT).
- **Indexing:**
  - Index all Foreign Keys.
  - Index columns frequently used in `WHERE`, `ORDER BY`, or `JOIN` clauses.
  - Use composite indexes for frequent multi-column queries.
- **Null Safety:** Default to `NOT NULL` unless optionality is strictly required by domain logic.

### Authentication (Identity)
- **Delegation:** Do not roll custom crypto. Use established libraries (NextAuth/Auth.js) or managed services (Clerk, Supabase Auth).
- **Session Management:**
  - Use HttpOnly, Secure, SameSite cookies for session tokens.
  - Implement token rotation for long-lived sessions.
- **Passwords:** If handling credentials locally (discouraged), use `bcrypt` or `argon2` with adequate work factors. Never store plain text.

### Authorization (Access Control)
- **Layered Defense:**
  1. **Edge/Middleware:** Validate presence of session/token.
  2. **Application Layer:** Role-Based Access Control (RBAC) checks in service methods.
  3. **Data Layer:** Row Level Security (RLS) policies within the database engine itself.
- **Principle of Least Privilege:** Default to `deny-all` and explicitly grant permissions.
- **Multi-Tenancy:** Ensure every query includes a `tenant_id` or `user_id` filter clause to prevent data leakage between users.

### Error Handling
- **Centralized Handler:** Implementation of a global error interceptor to catch unhandled exceptions.
- **Classification:** Distinguish between `Operational Errors` (invalid input, network down - handle gracefully) and `Programmer Errors` (bugs - crash/alert).
- **Sanitization:** NEVER leak stack traces or raw database errors to the client in production. Map to generic, user-friendly messages.
- **Standardization:** Return standard error objects: `{ "error": "InternalCode", "message": "Human readable", "details": {} }`.

### Logging & Observability
- **Structured Logging:** Log as JSON, not plain text, to enable querying (e.g., `{ level: "error", userId: "123", message: "Failed payment" }`).
- **Levels:** Strictly use Log Levels (`DEBUG`, `INFO`, `WARN`, `ERROR`).
- **PII Redaction:** Automatically scrub sensitive fields (passwords, emails, credit cards) before writing logs.
- **Correlation:** Generate a `Request-ID` (Correlation ID) at the entry point and propagate it through all downstream function calls/logs for tracing.

---

# 5. Mobile Development

## Swift Development Guidelines

### Project Structure & Architecture
- **Feature-First Organization:** Do not group by file type (Views, Models). Group by Feature.
  ```text
  Sources/
  ├── App/                 # App entry point, Configuration
  ├── Core/                # Shared extensions, Network layer, Design System
  ├── Features/
  │   ├── Auth/
  │   │   ├── Views/
  │   │   ├── ViewModels/
  │   │   └── Services/
  │   └── Dashboard/
  ```
- **Pattern:** Use **MVVM** (Model-View-ViewModel) for standard flows.
  - **Views:** Declarative, dumb components. No business logic.
  - **ViewModels:** `@Observable` classes. Handle state, user intents, and calls to services.
  - **Services:** Stateless structs or actors. Handle networking and DB logic.
- **Dependency Injection:** Use Protocol-based dependency injection. Avoid global Singletons (`.shared`) for Logic/Services to ensure testability.

### Modern Swift Syntax (Swift 6+)
- **Concurrency:**
  - **Strictly enforce `async`/`await`.** Do NOT use completion handlers (`@escaping (Result) -> Void`) or Combine for one-shot async tasks.
  - **Actors:** Use `actor` for shared mutable state to prevent data races.
  - **Main Thread:** Annotate UI-facing classes/functions with `@MainActor`.
- **Observation:**
  - Use the **`@Observable` macro** (Observation framework) over `ObservableObject`/`@Published`.
  - Prefer `let` constants. Use `var` only when mutation is required.
- **Value Types:** Default to `struct` and `enum`. Use `class` only for identity-based types (ViewModels, Database Managers).
- **Optionals:**
  - **Ban Force Unwrapping:** Never use `!` (except for `IBOutlets` or Unit Tests).
  - Use `guard let` for early exits or `if let` for scope-specific access.
  - Use `??` (nil coalescing) to provide default values.

### SwiftUI Guidelines
- **Views:**
  - Keep `body` clean. Extract sub-views if a View exceeds ~150 lines.
  - Use `@ViewBuilder` for conditional UI logic within the body.
- **Previews:** Use the **`#Preview` macro** (Swift 5.9+). Do not use `PreviewProvider` structs.
- **State Management:**
  - `@State`: For private, ephemeral UI state (e.g., toggle isExpanded).
  - `@Binding`: For passing write access to a child view.
  - `@Environment`: For global dependencies (e.g., Theme, AuthState).
- **Modifiers:**
  - Create custom `ViewModifier`s for repetitive styling.
  - Order matters: Apply layout modifiers (padding, frame) *before* background/border modifiers.

### Performance Optimization (Swift)
- **Lists:**
  - Always use `LazyVStack` or `List` for collections.
  - Ensure all data models conform to `Identifiable`. Never use `id: \.self` unless the data is truly static and unique.
- **Images:** Use `AsyncImage` with caching, or third-party libraries (e.g., Nuke) if aggressive caching is needed.
- **Computations:** Move heavy computations off the Main Actor using `Task.detached` or `nonisolated`.

### Testing (Swift Testing)
- **Framework:** Use **Swift Testing** (`import Testing`) over XCTest for new code.
- **Structure:**
  - Use `@Test` macro.
  - Use `#expect(...)` for assertions.
- **Mocking:**
  - Create `MockService` structs implementing the same Protocol as the real service.
  - Inject mocks into ViewModels during initialization.
- **Scope:**
  - **Unit:** Test ViewModels (State changes) and Services (Parsing).
  - **Snapshot:** Use `Point-Free SnapshotTesting` for complex UI layouts (optional).

### Dependency Management
- **Standard:** Use **Swift Package Manager (SPM)** exclusively.
- **Legacy:** Do not use CocoaPods or Carthage.
- **Versioning:** Pin packages to specific versions or minor ranges (e.g., `from: "2.1.0"`).

### Code Style & Formatting (Swift)
- **Linter:** Enforce **SwiftLint** with strict rules.
- **Naming:**
  - **Generic Types:** `T`, `U` for simple generics; `Element`, `Response` for descriptive ones.
  - **Protocol Naming:** Use `Service` suffix (e.g., `AuthService`) or `able` suffix (e.g., `Codable`).
- **Extensions:**
  - Use extensions to separate protocol conformance (`extension MyView: Equatable`).
  - Use extensions to group standard library enhancements (`extension String`).

### Security (Swift)
- **Storage:** NEVER store sensitive data (Tokens, Passwords) in `UserDefaults`. Use **Keychain** (via `Security` framework or a wrapper like `KeychainAccess`).
- **Networking:** Implement SSL Pinning for high-security apps.
- **Logs:** Strip sensitive data from console logs in Release builds. Use the `OSLog` framework (Logger), not `print()`.

## React Native (Expo) Guidelines

### Project Setup
- **Stack:** Expo SDK 52+ for React Native 0.76 compatibility.
- **Initialization:** `npx create-expo-app@latest --template blank-typescript`.
- **Workflow:** Opt for **Managed Workflow** initially (no ejecting). Use `npx expo prebuild` only if custom native code is strictly necessary.
- **Dependencies:** Pin versions in `package-lock.json` (e.g., `expo@~52.0.0`, `react-native@0.76.0`).
- **Env:** Validate environment variables with `expo-env` or Zod.

### Directory Structure
Keep `/app` routing-only; colocate feature logic.
```text
app/
├── (tabs)/          # Root navigation groups
│   ├── index.tsx    # Home screen
│   └── journal/     # Feature screens
├── _layout.tsx      # Root layout (Expo Router)
components/          # Reusable UI (Pressable > TouchableOpacity)
hooks/               # Custom hooks (e.g., useJournalQuery)
lib/                 # Utils, API client, constants
types/               # TS interfaces
expo-env.d.ts        # Env types
```

### Coding Standards
- **Components:** Functional with Hooks. Split presentational/container. Use `React.memo` + `useCallback` to curb re-renders.
- **Styling:**
  - Use Platform extensions (`.ios.tsx`, `.android.tsx`) where needed.
  - Tailwind via `nativewind` or `StyleSheet`.
  - Consistent design system (e.g., Tamagui).
- **Navigation:**
  - Use **Expo Router** for file-based routing.
  - Prefer Sheets over Modals.
  - Use URL state for shareable deep links.
- **Lists:**
  - `FlatList` with `keyExtractor` and `getItemLayout`.
  - Virtualize lists > 50 items.
  - Avoid `ScrollView` for long lists.
- **State:**
  - **Global:** Zustand/Jotai (auth, theme).
  - **Local:** `useState`.
  - **Async:** TanStack Query for data fetching/caching.

### Performance Optimization
- **Compiler:** Enable React Compiler (`new-arch` enabled).
- **Profiling:** Use Flipper or Chrome DevTools.
- **Engine:** Hermes engine (default).
- **Assets:**
  - Lazy-load images with `expo-image`.
  - Compress assets via `expo-asset`.
- **Animations:** Batch updates with `Reanimated` worklets.
- **Updates:** Use OTA (Over-the-Air) updates for JS fixes post-release.

### Security Guidelines
- **Input:** Sanitize inputs (Zod).
- **Storage:** Use **Expo SecureStore** for tokens/secrets. DO NOT store sensitive data in Async Storage.
- **Communication:** HTTPS always. Manage secrets via Expo's EAS.
- **Auth:** Use Clerk or Expo Auth Session. No client-side business logic.
- **Compliance:** GDPR-compliant via Expo's GCP hosting if applicable.

### Testing & Deployment
- **Unit Testing:** Jest/Vitest + `@testing-library/react-native` (AAA pattern).
- **E2E Testing:** Detox or Appium. Run in CI.
- **Build/Deploy:**
  - `eas build --platform all` for binaries.
  - `eas update` for OTA updates.
  - Use GitHub Actions for PR checks.
- **Version Control:** Follow Conventional Commits. Squash PRs. Branch naming: `feature/journal-entry`.