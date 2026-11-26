# CLAUDE.md — Rules for AI coding assistants

Read this fully before every task. **Project:** Hybrid Athlete — Personal Edition (a single owner-athlete).

## 1. Who you're working with

- The owner is a **beginner developer** who works from an **iPhone** with cloud tools.
- Explain in plain language, and define each technical term the first time you use it.
- Keep each Pull Request (PR) to **one small, testable change**.
- End every task with: what changed, how to test it on the Vercel preview, and any action the owner must take.

## 2. Hard rules

1. **No secrets in code.** Read secrets from `process.env` on the server only. Update `.env.example` with **empty** values.
2. **Never use `NEXT_PUBLIC_` for a secret.** The Garmin key, AI key, service-role key and cron secret are server-only.
3. **Don't invent API capabilities.** For Garmin, use only what the official Personal API documentation (its Swagger docs) shows. If an endpoint or field isn't documented, don't use it. Ask instead.
4. **Don't add integrations or commercial features** (payments, subscriptions, social, leaderboards, multi-user admin) unless they're approved in `IMPLEMENTATION_PLAN.md`.
5. **Don't use mock data as real data.** Seed data (such as the exercise library) is reference data. Demo or sample values live only in tests or in Storybook-style previews, and they're clearly labeled.
6. **Missing means NULL.** Never store `0` or a guess where a value is unknown.
7. **Every row records provenance:** `source`, `value_origin` and timestamps. See `DATABASE_DESIGN.md`.
8. **The AI never writes to plans, targets or goals.** It may only create rows in `ai_recommendations` and `ai_change_proposals`. Changes are applied **only** by code that runs after the owner taps Approve.
9. **The AI never calculates the numbers.** Metrics such as load, pace and ACWR are computed in `src/core/`. The AI explains them.
10. **RLS is on for every table.** Policies are limited to `auth.uid()`, even though there is only one user.
11. **Schema changes go in new migration files** in `supabase/migrations/`. Never edit a migration that has already been merged.
12. **No hard-coded text.** Every string goes in both `messages/en.json` and `messages/ar.json`.
13. **Use logical CSS only** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`). Never `ml-`, `mr-`, `pl-`, `pr-`, `left-` or `right-`.
14. **No medical diagnosis.** The coach refers pain, injury and medical questions to a professional.
15. **New npm dependency?** Name it in the PR summary with a one-line reason.

## 3. Stack

Next.js (App Router) · TypeScript `strict` · Tailwind CSS · Supabase (`@supabase/ssr`) · Zod · `next-intl` · Vercel · GitHub.

## 4. Where code goes

| Code | Location |
|---|---|
| Routes and pages | `src/app/[locale]/...` |
| Feature UI, actions, queries | `src/features/<module>/` |
| Shared UI | `src/components/ui/` |
| **Pure logic** (metrics, duplicate matching, unit conversion, types) | `src/core/` |
| Garmin client and mappers | `src/integrations/garmin/` |
| AI coach (prompt building, guardrails, provider adapter) | `src/features/coach/server/` |
| Scheduled jobs | `src/app/api/cron/*` (protected by `CRON_SECRET`) |
| Supabase clients | `src/lib/supabase/` |
| Migrations | `supabase/migrations/` |

`src/core/` must contain **no** imports from React, Next.js or Supabase, and no browser APIs, so the Expo app can reuse it later.

## 5. Conventions

- Server Components by default. Use `"use client"` only when a component needs interactivity.
- Writes go through Server Actions, validated with Zod.
- Use metric units in storage (kg, m, s, kcal) and convert for display.
- Store times as `timestamptz` (UTC). Display them in the owner's time zone (Asia/Dubai by default, configurable).
- Every screen handles loading, empty, error and "data missing" states.

## 6. Pull Request checklist

- [ ] `lint`, `typecheck` and `build` pass, and the tests pass
- [ ] The change was checked in `/en` and `/ar`
- [ ] New tables have RLS, and the types were regenerated
- [ ] No secrets, and no logging of personal or health data
- [ ] The PR description is in plain language, with steps to test the preview

## 7. When unsure

Ask the owner before guessing.
