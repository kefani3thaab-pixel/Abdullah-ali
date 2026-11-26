# IMPLEMENTATION_PLAN.md — Personal Edition v2.0

Each phase ends with a **working app on Vercel** that you can test on your iPhone. Nothing moves to the next phase until you approve.

## 1. Open decisions (needed from the owner)

| # | Decision | Needed by | Default proposal |
|---|---|---|---|
| D1 | AI provider for the coach | Phase 7 | Owner chooses; a single adapter file keeps it swappable |
| D2 | Digits in Arabic UI: Western (0–9) or Arabic-Indic (٠–٩) | Phase 1 | Western |
| D3 | Chart time axes in RTL: left-to-right or mirrored | Phase 5 | Left-to-right |
| D4 | Weekly review day | Phase 7 | Sunday morning |
| D5 | Garmin key expiry period | Phase 6 | 1 year, the longest option, so it needs renewing least often |

## 2. MVP scope

### Phase 0 — Accounts & setup (owner, about 1 hour)
GitHub repository, Supabase project, Vercel project. Create the owner user in Supabase and turn sign-ups off.
**Done when:** all three are linked, and Vercel shows an empty deployment.

### Phase 1 — Foundation
- 1.1 Next.js + TypeScript + Tailwind scaffold, design tokens, fonts, `.env.example`, lint and typecheck scripts
- 1.2 Arabic and English routing (`/ar`, `/en`), direction switching, language toggle
- 1.3 App shell: header, bottom tab bar, safe areas, empty screens for each module
- 1.4 Supabase connection and owner-only sign-in with MFA, plus the middleware owner check
- 1.5 PWA manifest and icons

**Done when:** you can sign in on your iPhone, switch Arabic and English, see the layout flip, and add the app to your Home Screen.

### Phase 2 — Profile, goals & body weight
Migration `0001`. Forms for profile, goals and weight logging, plus a simple weight trend chart.

### Phase 3 — Training logging (manual)
Migration `0002` and the exercise library seed. Log strength sessions (exercises → sets), functional workouts (AMRAP, EMOM and others), runs (distance, time, HR, RPE, splits) and mobility. Includes training history and personal records.

### Phase 4 — Recovery & nutrition (manual)
Migrations `0003` and `0004`. Daily check-in (sleep, soreness, energy), nutrition targets (set by you), meal and item logging, saved foods, and a daily total against target.

### Phase 5 — Dashboard & analytics
Metrics in `src/core/metrics` (with unit tests): weekly volume, pace trend, session load, ACWR, consistency, e1RM, and nutrition adherence. Dashboard tiles and analytics charts carry data-quality badges.

### Phase 6 — Garmin integration
- 6.0 **Research task (no code):** read Garmin's official Personal API Swagger docs. Write `docs/garmin-endpoints.md` with the exact endpoints, fields, date-range limits and any rate limits. **You approve this file before any code is written.**
- 6.1 Migration `0006`, the server-only token exchange, and a "Test connection" button in Settings
- 6.2 Activity sync (pull): mapping, the duplicate check, and the sync log
- 6.3 Health and sleep sync into `wellness_daily`, limited to the fields the docs confirm
- 6.4 FIT and GPX file upload as the fallback import
- 6.5 Scheduled daily sync, the "Sync now" button, the possible-duplicate review screen, and a key-expiry reminder

### Phase 7 — AI coach
Migration `0007`. Coach context builder (summaries with data-quality labels), guardrails, output schema, daily recommendation, alerts, weekly review, change proposals with Approve and Reject, chat, and the usage cap.

### Phase 8 — Polish & launch
Accessibility pass, a full RTL review, empty and error states, performance checks, and data export (CSV/JSON of your own data).

## 3. Future enhancements (not in the MVP)

- Offline mode and background sync (service worker)
- Push notifications (on iPhone, these work only when the app is installed on the Home Screen)
- React Native + Expo app (monorepo + `packages/core`)
- Apple Health data. This needs a native app; a web app can't access it.
- A food database or barcode scanning. This requires choosing and approving an integration.
- Photo-based meal logging
- Sending workouts **to** Garmin. This needs the business Training API, which isn't part of the Personal tier.
- Training-plan generator (the AI proposes a full program, and you approve it)

## 4. Technical risks & limitations

| Risk | Impact | Mitigation |
|---|---|---|
| Garmin Personal API is new (October 2026). Its docs don't state the history range or rate limits. | Sync may be limited or change | Research step 6.0 first; FIT/GPX import as a fallback; all Garmin code isolated in one folder |
| Garmin key expires (one year at most) | Sync stops | Expiry date stored; reminder 14 days before; clear "expired" status |
| No refresh tokens; tokens last 24 h | Extra token calls | Request a token at the start of each sync run |
| Pull-only (no push) | Data arrives with a delay | A daily schedule plus "Sync now" |
| Duplicate activities (manual + Garmin) | Inflated load stats | Unique external IDs, content hashes, probable-match review |
| AI gives wrong or overconfident advice | Training errors or injury risk | Metrics are deterministic; data-quality labels; proposals only; medical boundary; reasoning always shown |
| AI costs | Unexpected bills | One daily run, a monthly cap, and tracking in `ai_usage` |
| Health data privacy | Personal exposure | RLS, MFA, sign-ups off, server-only secrets, no logging of personal data, private Storage |
| Vercel and Supabase free-plan limits (for example, scheduled job frequency, or projects pausing after inactivity) | The cron job or database stops | Check the plan limits when building Phase 6; daily usage keeps the project active; upgrade if needed |
| RTL layout bugs | Broken Arabic screens | Logical classes enforced in review; every PR tested in `/ar` |
| Developing from an iPhone | Hard to debug | Small PRs; Vercel preview links; clear error messages in the UI |
| Scope creep | Never finishing | MVP vs Future list; nothing is built without approval |

## 5. The next implementation task (awaiting approval)

**Phase 1.1 — Project scaffold.** This task contains no features and no database.

Deliverables in a single Pull Request:
1. A Next.js (App Router) + TypeScript (strict) + Tailwind project at the repo root
2. Design tokens from `DESIGN_SYSTEM.md` in the Tailwind theme, and the Inter, Barlow Semi Condensed and IBM Plex Sans Arabic fonts
3. `.env.example` (names only), with `.gitignore` covering `.env*.local`
4. The `lint`, `typecheck` and `build` scripts
5. The six docs committed to the repo
6. A placeholder home page in the dark theme, with the text "Hybrid Athlete", and a lime button that does nothing yet

**Owner prerequisites:** Phase 0 is done (the GitHub repository exists and is connected to Vercel).

**Test on iPhone:** open the Vercel preview link. You should see a dark charcoal page with the lime button and the correct fonts.
