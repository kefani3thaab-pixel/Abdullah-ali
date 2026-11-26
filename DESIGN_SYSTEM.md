# DESIGN_SYSTEM.md — Premium Hybrid Sport Tech

Mobile-first (iPhone), dark, data-dense and calm. Electric lime is used **sparingly**, for the one thing that matters most on each screen.

## 1. Color tokens

| Token | Hex | Use |
|---|---|---|
| `bg` | `#101214` | App background |
| `surface` | `#191D20` | Cards, sheets |
| `surface-2` | `#22272B` | Inputs, nested cards, hover |
| `border` | `#2C3236` | Dividers, card outlines |
| `text` | `#F5F6F4` | Primary text |
| `text-muted` | `#929A9D` | Labels, secondary text |
| `accent` | `#C6F135` | Primary action, key metric, active tab |
| `accent-ink` | `#101214` | Text and icons **on** lime |
| `success` | `#4ADE80` | Goal hit, sync OK |
| `warning` | `#FBBF24` | Load caution, key expiring |
| `danger` | `#F87171` | Errors, overload alert |
| `info` | `#60A5FA` | Neutral notices |

**Discipline colors** (charts and tags):

| Discipline | Hex |
|---|---|
| Strength | `#C6F135` (lime) |
| Running | `#38BDF8` (sky) |
| Functional | `#FB923C` (orange) |
| Mobility / Recovery | `#A78BFA` (violet) |
| Nutrition | `#F472B6` (pink) |

**Contrast:** `text` on `bg` and `accent-ink` on `accent` both pass WCAG AA. `text-muted` is for labels and secondary text only.

**Data-quality badges** (`DataBadge` component):

| Label | Style |
|---|---|
| Measured | Solid outline, small device icon |
| Entered | Outline, small pencil icon |
| Estimated | Dashed outline, "≈" symbol |
| Missing | Muted text "—", with the label "Missing" |

## 2. Typography

| Role | Latin | Arabic |
|---|---|---|
| UI / body | Inter | IBM Plex Sans Arabic |
| Display / big numbers | Barlow Semi Condensed (600–700) | IBM Plex Sans Arabic (600–700) |

All fonts are loaded with `next/font` (self-hosted, with no runtime calls to a font service). Numbers use **tabular figures** (`font-variant-numeric: tabular-nums`) so stats don't shift as they change.

| Token | Size / line height | Use |
|---|---|---|
| `display` | 40 / 44 | Hero metric |
| `h1` | 28 / 34 | Screen title |
| `h2` | 22 / 28 | Section |
| `h3` | 18 / 24 | Card title |
| `body` | 16 / 24 | Default (never smaller on inputs; this prevents iOS from zooming in) |
| `small` | 14 / 20 | Labels |
| `micro` | 12 / 16 | Badges, axes |

Arabic text gets a little extra line height (+2 px) so it doesn't feel cramped.

## 3. Spacing, radius, elevation

- **Spacing:** 4 px scale (4, 8, 12, 16, 20, 24, 32, 40, 48). Screen padding is 16 px.
- **Radius:** `sm` 8 · `md` 12 · `lg` 16 (cards) · `full` (pills).
- **Elevation:** shown by surface color and a 1 px border, not heavy shadows. Lime glow (`0 0 0 1px accent`) appears only on focus.
- **Touch targets:** at least 44 × 44 px.
- **Safe areas:** use `env(safe-area-inset-*)` for the iPhone notch and home bar.

## 4. Core components

| Component | Notes |
|---|---|
| `AppShell` | Header + content + **bottom tab bar** (Dashboard, Training, Running, Coach, More) |
| `Button` | `primary` (lime), `secondary` (surface-2), `ghost`, `danger`; a loading state |
| `Card` | Surface, border, radius `lg`, padding 16 |
| `StatTile` | Label, big tabular value, unit, trend arrow, `DataBadge` |
| `DataBadge` | Measured, Entered, Estimated or Missing |
| `ProposalCard` | The AI's suggested change, with its reason and **Approve** / **Reject** buttons |
| `CoachNote` | Daily recommendation, with a "Why?" section that expands and lists the data used |
| `Input`, `NumberStepper`, `Select`, `SegmentedControl`, `Sheet` (bottom sheet) | Form building blocks |
| `SetRow` | Fast set logging: reps × weight, RPE, done |
| `ChartCard` | Title, period switcher, chart, empty state |
| `EmptyState` | Icon, a one-line explanation and the next action |
| `SyncStatus` | Last sync time, status color, "Sync now" button |

## 5. Charts

- Thin lines (2 px), no 3D effects, minimal gridlines (`border` color).
- Discipline colors as listed above. Estimated series are drawn **dashed**.
- Gaps in the data are shown as gaps, never filled with zero.
- Every chart has an empty state ("No runs logged this week").

## 6. RTL / LTR rules

1. Set `<html dir="rtl" lang="ar">` or `dir="ltr" lang="en"` from the locale.
2. **Use logical Tailwind classes only:** `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start` and `text-end`. Never left or right.
3. **Mirror** directional icons (back, forward, chevrons) with `rtl:-scale-x-100`. **Don't mirror** icons that aren't directional, such as play, the clock, logos, or the checkmark.
4. **Chart time axes stay left-to-right** in both languages (oldest to newest), which is a common convention for numeric data. Labels and legends are translated. (Decision to confirm after testing.)
5. Numbers, units and paces such as `4:35 /km` are wrapped in `<bdi>` or `dir="ltr"` spans so they never scramble inside Arabic sentences.
6. Test every screen in both `/ar` and `/en` before merging.

## 7. Motion

Use 150–200 ms ease-out for presses and sheets. Respect `prefers-reduced-motion`. Avoid decorative animation on data.

## 8. Voice & tone

Write like a coach: short, direct and encouraging. Explain the "why" in one sentence. Write Arabic as natural Modern Standard Arabic, not a word-for-word translation of the English.
