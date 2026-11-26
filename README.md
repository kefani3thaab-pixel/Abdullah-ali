# Hybrid Athlete — Personal Edition

A private, AI-powered hybrid fitness system for **one athlete: the owner**. It brings strength, functional fitness, running, mobility, nutrition, recovery, Garmin data and an AI coach together in one place. It works in **Arabic and English**, with full RTL and LTR layouts.

> **Status:** Planning, version 2.0 (Personal Edition). No application code has been written yet.
> Every feature waits for the owner's approval before it is built.

---

## 1. What it does (planned)

| Module | What it gives you |
|---|---|
| Personal Dashboard | Today's plan, readiness, weekly load and the coach's note, on one screen |
| Athlete Profile & Goals | Your details, current goals and goal history |
| Strength & Functional | Log sets, reps, weight, RPE, AMRAP, EMOM and timed workouts |
| Running Intelligence | Runs from Garmin or entered by hand, with pace, heart rate, splits and trends |
| AI Personal Coach | Daily recommendations, weekly reviews and chat, always with its reasons |
| Nutrition | Meals, calories and macros against your approved targets |
| Recovery & Mobility | Sleep, soreness, energy and mobility sessions |
| Performance Analytics | Volume, load, personal records and progress charts |
| Wearable Integrations | Garmin Connect, through Garmin's official Personal API |

**Not included, by design:** subscriptions, payments, community, public profiles, leaderboards and multi-user admin.

---

## 2. Two rules that shape everything

1. **The AI coach suggests. You decide.** It never changes your program, nutrition targets or goals on its own. Any significant change appears as a proposal with **Approve** and **Reject** buttons.
2. **Every number shows where it came from:** **Measured** (recorded by a device), **Entered** (typed in by you), **Estimated** (calculated by the app) or **Missing**. A missing value stays empty. It is never shown as zero.

---

## 3. The technology, in plain words

| Tool | What it does for us |
|---|---|
| **Next.js** | Builds the pages and the server code |
| **TypeScript** | JavaScript with checks that catch mistakes early |
| **Tailwind CSS** | Styling with short class names |
| **Supabase** | Database, login and file storage |
| **GitHub** | Stores the code and its history |
| **Vercel** | Puts the site online and makes a preview link for every change |
| **PWA** | Lets you "Add to Home Screen" on your iPhone so it opens like an app |
| **Garmin Personal API** | Garmin's official way for you to read **your own** Garmin data |

A **React Native + Expo** app comes later and will reuse the pure logic in `src/core/`.

---

## 4. Working from an iPhone

```
Change (cloud coding tool) → Pull Request → Vercel preview link → test on iPhone → Merge → Live
```

- Make changes in a cloud tool (Claude Code on the web, or GitHub Codespaces in Safari).
- Review and merge in the **GitHub** app.
- Test each preview link in **Safari**.

---

## 5. One-time setup (do these yourself, because they involve secrets)

- [ ] Create a **private** GitHub repository named `hybrid-athlete`
- [ ] Create a **Supabase** project and save the database password in a password manager
- [ ] In Supabase → Authentication: create **your** user, then **turn off public sign-ups**
- [ ] Create a **Vercel** project from the GitHub repo
- [ ] Later, in Phase 6, create your **Garmin Personal API key** at Garmin Connect Web → Settings → Personal API Key. It is shown **only once**, so save it straight away.
- [ ] Choose the AI provider for the coach (an open decision; see `IMPLEMENTATION_PLAN.md`)

---

## 6. Environment variables (secrets)

| Name | Where it's used | Visible in the browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | ✅ Yes (public by design) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | ✅ Yes (the data is protected by Row Level Security) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (scheduled sync jobs) | ❌ Never |
| `GARMIN_PERSONAL_API_KEY` | Server only | ❌ Never |
| `AI_PROVIDER_API_KEY` | Server only | ❌ Never |
| `CRON_SECRET` | Server only (protects the scheduled jobs) | ❌ Never |
| `OWNER_EMAIL` | Server only (the only account allowed in) | ❌ Never |

**Golden rule:** anything that starts with `NEXT_PUBLIC_` is visible to anyone. Never put a secret behind that prefix.

Real values live **only** in Vercel → Settings → Environment Variables. The repository contains only `.env.example`, which has empty values.

**Garmin key reminder:** a Personal API key expires after the period you chose: 30, 90 or 180 days, or one year. Garmin emails a reminder about a week before. When that happens, create a new key and replace the value in Vercel.

---

## 7. Commands (available after Phase 1)

| Command | What it does |
|---|---|
| `npm install` | Installs the libraries |
| `npm run dev` | Starts a development server |
| `npm run build` | Checks the production build |
| `npm run lint` / `npm run typecheck` / `npm run test` | Runs the quality checks |
| `npx supabase gen types typescript` | Regenerates the database types after a schema change |

---

## 8. Documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Rules for AI coding assistants in this repo |
| `ARCHITECTURE.md` | How the system fits together: Garmin sync, AI coach, folders |
| `DATABASE_DESIGN.md` | Tables, data provenance, duplicate prevention, security |
| `DESIGN_SYSTEM.md` | Colors, type, components, RTL rules |
| `IMPLEMENTATION_PLAN.md` | MVP phases, future enhancements, risks, next task |

## 9. Glossary

- **Provenance:** where a piece of data came from, and when.
- **Pull sync:** the app asks Garmin for new data. (Garmin doesn't send it to us automatically.)
- **FIT file:** Garmin's detailed activity file format, which includes GPS, heart rate and laps.
- **RLS (Row Level Security):** database rules that limit who can read each row.
- **Migration:** a numbered file that changes the database structure.
- **RPE:** effort rating from 1 to 10. **e1RM:** estimated one-rep max. **ACWR:** acute-to-chronic workload ratio, a measure of how this week's load compares with your usual load.

## 10. Disclaimer

This is a personal training tool, **not** a medical device. Its recommendations are general fitness guidance. For injuries, pain or medical questions, consult a qualified professional.
