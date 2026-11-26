# ARCHITECTURE.md — Personal Edition v2.0

## 1. The big picture

One owner, one web app, one database, and two data sources (Garmin and manual entry) that feed one unified training history.

```
                 ┌──────────────────────────────────────────┐
  iPhone (PWA) ─▶│  Next.js app on Vercel                   │
                 │  • Pages (Arabic / English, RTL / LTR)   │
                 │  • Server Actions (validated writes)     │
                 │  • /api/cron/* scheduled jobs            │
                 │  • src/core  (pure calculations)         │
                 └───────┬──────────────┬─────────────┬─────┘
                         │              │             │
                         ▼              ▼             ▼
                  Supabase        Garmin Personal   AI provider
                  (Postgres,      API (pull only,   (provider still
                   Auth, Storage)  your own data)    to be decided)
```

**Why this is the simplest design that can grow:**

- **One Next.js app** contains both the website and the server code, so there's no separate backend to run.
- **Supabase** provides the database, login and file storage in one service.
- **The pure logic in `src/core/` is separate**, so the future Expo app can reuse it.
- **No microservices, no queues, no extra vendors.**

---

## 2. Personal-only security model

| Layer | What it does |
|---|---|
| Supabase Auth | Email and password, plus **TOTP multi-factor authentication** (an authenticator app) |
| Sign-ups disabled | Turned off in Supabase settings. Only the owner account exists. |
| Owner check | The middleware also refuses any session whose email isn't `OWNER_EMAIL` |
| Row Level Security | Every table: `user_id = auth.uid()`. If a key leaks, the data still stays locked. |
| Server-only secrets | The Garmin, AI, service-role and cron keys never reach the browser |
| Cron protection | Scheduled routes require the `Authorization: Bearer ${CRON_SECRET}` header |

We keep `user_id` and RLS even with a single user. It costs little, it's the right security pattern, and it keeps the option of a family or coach account open later without a rewrite.

---

## 3. Data sources and how they coexist

### 3.1 Garmin: what's officially available (checked November 2026)

Garmin now offers a **Personal** tier for individuals who want their **own** data:

| Fact | Detail |
|---|---|
| Data included | Activity data (JSON and .FIT), health data (JSON), women's health data (JSON) |
| Delivery | **Pull only.** We request the data; Garmin doesn't push it to us. |
| Key | Created by the owner in Garmin Connect Web. It is shown **once**, and it expires after 30, 90 or 180 days, or one year. |
| Access tokens | The key is exchanged for an OAuth2 access token. The token lasts 24 hours, or until the key expires if that comes first. There are **no refresh tokens**. |
| Use | Personal use only. It is not for commercial apps with many users. |
| Not specified by Garmin | Historical data range, rate limits and the exact list of metrics. **These must be checked in the Swagger docs before we build.** |

**Not available to us:** the business APIs (Training API for pushing workouts, Courses API, push notifications or webhooks). They require an approved business application.

**What this means for our design:**
- The key is stored as a **Vercel environment variable**, never in the database or the browser.
- The server exchanges the key for a token, keeps it in memory for no more than 24 hours, and asks for a new one when needed.
- Sync is **pull-based**: a scheduled daily job plus a **"Sync now"** button.
- Before we write any Garmin code, Phase 6 starts by reading Garmin's official Swagger docs and recording the exact endpoints and fields we'll use in `docs/garmin-endpoints.md`. Until then, **no endpoint is assumed**.

### 3.2 Fallback: FIT/GPX file import (no API required)

Garmin Connect lets you export an activity as a file. Our app will accept an uploaded **.FIT or .GPX** file and import it the same way an API sync would. This keeps the app useful if the Garmin key expires, the API changes or access is limited.

### 3.3 Manual entry

Strength and functional workouts, runs, body weight, meals, sleep and recovery check-ins, and personal records.

### 3.4 The import pipeline (same for every source)

```
Source (Garmin API / FIT file / manual form)
   │
   ▼
1. Save raw  → raw_imports (original JSON / file in Storage, content hash)
2. Map       → src/integrations/garmin/mappers.ts → our standard shape
3. Validate  → Zod schema
4. Match     → src/core/dedup.ts  (is this already in our history?)
5. Write     → activities / wellness_daily / body_metrics
               with source, external_id, value_origin, timestamps
6. Log       → sync_runs (what was fetched, created, skipped, failed)
```

### 3.5 Duplicate prevention

| Check | Rule | Result |
|---|---|---|
| **Exact** | Same `source` + same `external_id` | Update the existing row (no duplicate created) |
| **Same file** | Same content hash in `raw_imports` | Skip |
| **Probable** | Same activity type, start time within ±10 min, duration within ±10% | Flag it as a possible duplicate and **ask the owner** to merge or keep both |

**Merge precedence** (when the owner confirms a merge):

| Field type | Winner |
|---|---|
| Device sensor data (GPS, heart rate, cadence, laps, distance) | Garmin (**measured**) |
| Subjective data (RPE, notes, how it felt) | Manual entry |
| Strength set details (exercise, reps, weight) | Manual entry, because Garmin's strength detection is less exact |

Both originals stay linked through `raw_imports`, so a merge never destroys data.

---

## 4. Proactive AI coach: a safe design

### 4.1 Principle: rules compute, the AI explains, the owner decides

```
Data ──▶ src/core metrics ──▶ Coach context ──▶ AI model ──▶ Validated output ──▶ Owner
         (deterministic)       (summaries +                  (Zod schema +       (reads /
                                data-quality labels)          guardrails)         approves)
```

1. **The deterministic layer** (`src/core/`) computes weekly running volume, pace trends, HR zones (only when HR data exists), strength progression, training consistency, session RPE load, ACWR, calorie and macro intake against target, and the sleep and recovery trend.
2. **The rule checks** flag patterns such as a load spike (ACWR above the threshold), three or more missed sessions, poor sleep several nights in a row, or calories far below target.
3. **The AI** receives **summaries and flags, not raw tables**. Each value is labeled `measured`, `entered`, `estimated` or `missing`. It writes the recommendation and its reasoning.
4. **The output is validated** against a strict schema. Anything that would change the program, targets or goals must be returned as a **proposal**. It can't be written as an action.

### 4.2 What it produces

| Output | When | Stored in |
|---|---|---|
| Daily recommendation | Early each morning (scheduled), or when the owner opens the app and today's note doesn't exist yet | `ai_recommendations` (type `daily`) |
| Alert | When a rule check flags overload or inconsistency | `ai_recommendations` (type `alert`) |
| Weekly review | Weekly, on a day the owner chooses | `ai_recommendations` (type `weekly_review`) |
| Change proposal | Only when the AI suggests changing the program, targets or goals | `ai_change_proposals` (status `pending`) |
| Chat | On demand | `ai_conversations` and `ai_messages` |

### 4.3 Guardrails

- **No silent changes:** the AI has no write access to `training_programs`, `nutrition_targets` or `goals`. Only the owner's **Approve** action applies a proposal, and the change is recorded in `audit_log`.
- **Honesty about data:** every recommendation lists the data it used, how complete that data was, and what was missing. With too little data, it says so instead of guessing.
- **Medical boundary:** if pain, injury, illness or a medical issue comes up, the coach recommends rest and seeing a professional. It never diagnoses.
- **Cost control:** at most one daily generation (plus any regeneration the owner asks for), and a monthly usage cap recorded in `ai_usage`.
- **Provider-agnostic:** one adapter file (`provider.ts`) talks to the AI model. **The provider is still to be decided by the owner.**

---

## 5. Folder structure

```
hybrid-athlete/
├─ README.md  CLAUDE.md  ARCHITECTURE.md  DATABASE_DESIGN.md
├─ DESIGN_SYSTEM.md  IMPLEMENTATION_PLAN.md
├─ docs/
│  └─ garmin-endpoints.md        # written in Phase 6 from the official docs
├─ .env.example                  # names only, empty values
├─ vercel.json                   # cron schedule
├─ middleware.ts                 # locale + auth + owner check
├─ messages/
│  ├─ en.json
│  └─ ar.json
├─ public/icons/                 # PWA icons
├─ supabase/
│  ├─ migrations/                # numbered SQL files
│  └─ seed.sql                   # exercise library (reference data only)
└─ src/
   ├─ app/
   │  ├─ [locale]/
   │  │  ├─ (auth)/sign-in/
   │  │  └─ (app)/
   │  │     ├─ dashboard/
   │  │     ├─ profile/          # profile + goals
   │  │     ├─ training/         # strength + functional
   │  │     ├─ running/
   │  │     ├─ coach/
   │  │     ├─ nutrition/
   │  │     ├─ recovery/         # sleep, check-ins, mobility
   │  │     ├─ analytics/
   │  │     └─ settings/         # language, units, integrations
   │  ├─ api/cron/
   │  │  ├─ garmin-sync/route.ts
   │  │  └─ coach-daily/route.ts
   │  └─ manifest.ts
   ├─ components/
   │  ├─ ui/                     # Button, Card, StatTile, DataBadge…
   │  ├─ layout/                 # AppShell, BottomNav, Header
   │  └─ charts/
   ├─ features/
   │  ├─ dashboard/ profile/ training/ running/
   │  ├─ nutrition/ recovery/ analytics/ integrations/
   │  └─ coach/
   │     ├─ components/
   │     └─ server/              # context builder, guardrails, provider.ts
   ├─ integrations/garmin/
   │  ├─ client.ts               # token exchange + documented calls only
   │  ├─ mappers.ts
   │  └─ fit-import.ts
   ├─ core/                      # PURE TypeScript, shareable with Expo
   │  ├─ metrics/                # load, acwr, pace, e1rm, consistency
   │  ├─ dedup.ts
   │  ├─ units.ts
   │  ├─ data-quality.ts
   │  └─ types.ts
   ├─ lib/supabase/              # server.ts, client.ts, admin.ts (server-only)
   └─ i18n/
```

Each feature folder follows the same pattern: `components/`, `actions.ts` (writes), `queries.ts` (reads) and `schemas.ts` (Zod).

---

## 6. Internationalization (Arabic / English)

- The locale is in the URL: `/ar/...` and `/en/...`. The `<html lang dir>` attributes are set from the locale.
- Styling uses Tailwind logical classes only, so the layout flips automatically.
- Numbers use Western digits (0–9) in both languages by default. (Decision to confirm.)
- Dates are formatted with `Intl.DateTimeFormat` for the locale.
- Exercise names are stored bilingually (`name_en`, `name_ar`).

## 7. PWA

Includes a web app manifest, icons, a standalone display mode and the theme color. A service worker for basic offline viewing comes in the **Future** list. On iPhone, the app must be opened from the Home Screen to behave like an app.

## 8. Path to Expo (future)

1. Convert the repo into a monorepo: `apps/web`, `apps/mobile`, `packages/core`.
2. Move `src/core/` into `packages/core`. It has no web dependencies, so it moves cleanly.
3. The mobile app uses the same Supabase project and the same RLS.
4. Styling uses NativeWind (Tailwind for React Native), so the design tokens can be reused.
