# Database Seeding

> How to seed the PromptPal dev and prod Convex databases.

## Overview

The seed script populates:

- **Apps** – PromptPal app config and limits
- **Learning modules** – Image, Coding, Copywriting
- **Learning resources** – Guides, cheatsheets, lexicon
- **Levels** – All game levels including onboarding-style coding lessons
- **Daily quests** – Quest pool
- **Achievements** – Badges and conditions

## Coding Module Lessons

The coding module uses **onboarding-style lessons** (prompt-for-UI flow):

- 15 lessons teaching prompt engineering for AI-assisted web development
- IDs: `code-1-easy` through `code-5-easy`, `code-6-medium` through `code-10-medium`, `code-11-hard` through `code-15-hard`
- Each lesson: `instruction`, `hint`, `starterCode`, `grading`, `failState`, `successState`, `lessonTakeaway`
- Source: `convex/coding_lessons_data.ts`

## Copywriting Module Lessons

The copywriting module uses **llm_judge lessons** (prompt-for-copy flow):

- 15 lessons teaching prompt engineering for AI-assisted copy
- IDs: `copywriting-1-easy` through `copywriting-3-easy`, `copywriting-4-medium` through `copywriting-7-medium`, `copywriting-8-hard` through `copywriting-15-hard`
- Each lesson: `instruction`, `hint`, `starterContext`, `grading`, `failState`, `successState`, `lessonTakeaway`
- Grading: `llm_judge` with custom criteria per lesson
- Source: `convex/copywriting_lessons_data.ts`

## Commands

### Seed dev database

From the repository root:

```bash
npx convex run seed:seedAll
```

Uses your default Convex dev deployment.

### Seed prod database

```bash
npx convex run seed:seedAll --prod
```

Uses the production deployment. Ensure `convex.json` or env points to prod.

### Seed individual tables

```bash
# Levels only (includes coding lessons)
npx convex run seed:seedLevels

# Apps, modules, resources, quests, achievements
npx convex run seed:seedApps
npx convex run seed:seedLearningModules
npx convex run seed:seedLearningResources
npx convex run seed:seedDailyQuests
npx convex run seed:seedAchievements
```

## Idempotency

- **Create**: Skips if record exists
- **Update**: Updates existing records (e.g. levels get latest data)

## Editing Lessons

1. Edit `convex/coding_lessons_data.ts`
2. Run `npx convex run seed:seedLevels` (or `seedAll`) for dev
3. Run with `--prod` for production
