# DATABASE_DESIGN.md — Personal Edition v2.0

Database: **Supabase Postgres**. Every change is made through a numbered migration file in `supabase/migrations/`.

## 1. Rules for every table

| Rule | Why |
|---|---|
| `id uuid primary key default gen_random_uuid()` | Unique IDs that are safe to share between web and mobile |
| `user_id uuid not null references auth.users` | Ownership |
| **RLS on**, with policy `user_id = auth.uid()` for select, insert, update and delete | Privacy |
| `created_at`, `updated_at timestamptz` | History |
| Metric units: `_kg`, `_m`, `_s`, `_kcal`, `_g`, `_bpm` | No unit confusion |
| **Unknown = `NULL`, never `0`** | Honest data |

Reference tables (such as `exercises`) can be read by any signed-in user, but only migrations can change them.

## 2. Provenance: the three labels on each record

| Column | Values | Meaning |
|---|---|---|
| `source` | `manual`, `garmin_api`, `file_import`, `system` | Where the record came from |
| `value_origin` | `measured`, `entered`, `estimated` | How the values were obtained (a device, the owner, or a calculation) |
| `recorded_at` / `started_at` | timestamptz | When it happened |
| `ingested_at` | timestamptz | When our app received it |
| `source_updated_at` | timestamptz, nullable | Last time the source changed it |
| `external_id` | text, nullable | The source's own ID, such as a Garmin activity ID |
| `raw_import_id` | uuid, nullable | Link to the original payload |

`missing` isn't stored. It is a `NULL` value, and the UI and the coach label it "Missing".

## 3. Enums

```
data_source       : manual | garmin_api | file_import | system
value_origin      : measured | entered | estimated
activity_type     : run | strength | functional | mobility | cardio_other
functional_format : amrap | emom | for_time | rounds | intervals | other
goal_status       : active | achieved | paused | archived
proposal_status   : pending | approved | rejected | expired
recommendation_t  : daily | weekly_review | alert
sync_status       : running | success | partial | failed
meal_type         : breakfast | lunch | dinner | snack | pre_workout | post_workout
```

## 4. Tables by module

### 4.1 Profile & goals
**profiles**: `user_id` (primary key), `display_name`, `locale` (`ar` | `en`), `time_zone` (default `Asia/Dubai`), `unit_system` (`metric` | `imperial`), `birth_year` (nullable), `height_cm` (nullable), `max_hr_bpm` (nullable, entered), `resting_hr_bpm` (nullable).

**goals**: `title`, `category` (strength | running | body_comp | nutrition | consistency | other), `target_value`, `target_unit`, `target_date`, `status`, `approved_at`.

### 4.2 Unified training history
**activities**: one row per session, from any source.
`activity_type`, `title`, `started_at`, `duration_s`, `distance_m`, `avg_hr_bpm`, `max_hr_bpm`, `calories_kcal`, `elevation_gain_m`, `avg_cadence_spm`, `rpe` (1–10, entered), `session_load` (estimated: RPE × minutes), `functional_format`, `functional_result` (such as "12 rounds + 5"), `notes`, `planned_session_id` (nullable), plus the provenance columns (section 2), plus `possible_duplicate_of` (uuid, nullable) and `merged_into` (uuid, nullable).

- **Unique index:** `(user_id, source, external_id)` where `external_id` is not null. This prevents exact duplicates.
- **Index:** `(user_id, started_at desc)`.

**activity_laps**: running splits. `activity_id`, `lap_index`, `distance_m`, `duration_s`, `avg_hr_bpm`, `avg_pace_s_per_km` (estimated from the other values).

**exercises** (reference): `slug`, `name_en`, `name_ar`, `category` (strength | functional | mobility | cardio), `equipment[]`, `primary_muscles[]`, `is_unilateral`.

**activity_exercises**: `activity_id`, `exercise_id`, `order_index`, `notes`.

**exercise_sets**: `activity_exercise_id`, `set_index`, `reps`, `weight_kg`, `duration_s`, `distance_m`, `rpe`, `is_warmup`.

**personal_records**: `exercise_id` or `metric` (such as `5k_time`), `value`, `unit`, `achieved_at`, `activity_id`, `value_origin` (an e1RM is `estimated`; an actual lift is `measured` or `entered`).

### 4.3 Training programs (the owner approves them)
**training_programs**: `name`, `start_date`, `end_date`, `status` (draft | active | completed), `approved_at`, `version`.

**planned_sessions**: `program_id`, `scheduled_date`, `activity_type`, `title`, `description`, `target_duration_s`, `target_distance_m`, `target_intensity`.

### 4.4 Body metrics
**body_metrics**: `recorded_at`, `weight_kg`, `body_fat_pct` (nullable), `waist_cm` (nullable), plus provenance.

### 4.5 Recovery & sleep
**wellness_daily**: one row per **date per source**.
`date`, `sleep_duration_s`, `sleep_score` (Garmin, if provided), `resting_hr_bpm`, `hrv_ms` (if provided), `stress_avg`, `soreness_1_5`, `energy_1_5`, `mood_1_5`, `sleep_quality_1_5` (entered), `notes`, plus provenance.
- **Unique:** `(user_id, date, source)`.
- **View `wellness_daily_merged`:** for each date, measured values come from Garmin and subjective values come from manual entry.

> The exact Garmin health fields are confirmed from the official docs in Phase 6. Columns for metrics Garmin doesn't provide stay `NULL`.

**mobility_sessions** are recorded as `activities` with `activity_type = mobility`. No separate table is needed.

### 4.6 Nutrition
**nutrition_targets**: versioned, and only ever changed by the owner. `effective_from`, `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `approved_at`, `created_via` (`manual` | `ai_proposal`).

**meals**: `eaten_at`, `meal_type`, `title`, `notes`, plus provenance.

**meal_items**: `meal_id`, `name`, `quantity`, `unit`, `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `value_origin` (`entered` from a label, or `estimated`).

**saved_foods**: the owner's own reusable foods. (No external food database in the MVP.)

### 4.7 AI coach
**ai_recommendations**: `type`, `for_date`, `summary`, `body`, `reasoning`, `data_used` (jsonb: which metrics and date ranges were used), `data_quality` (jsonb: share of values measured, entered, estimated and missing), `flags[]`, `model`, `prompt_version`, `status` (new | read | dismissed).
- **Unique:** `(user_id, type, for_date)`. This allows one daily note and one weekly review per period.

**ai_change_proposals**: `recommendation_id`, `target_kind` (program | nutrition_target | goal), `target_id`, `proposed_change` (jsonb), `reason`, `status`, `decided_at`, `expires_at`.

**ai_conversations** / **ai_messages**: `role` (user | assistant), `content`, `created_at`.

**ai_usage**: `month`, `requests`, `input_tokens`, `output_tokens`, used for the monthly cap.

### 4.8 External sources & sync
**data_sources**: `provider` (`garmin`), `status` (connected | expired | error | disconnected), `key_expires_at` (entered by the owner, for reminders), `last_successful_sync_at`, `last_error`.
> The Garmin key itself is **never** stored in the database. It lives only in Vercel's environment variables.

**sync_runs**: `provider`, `started_at`, `finished_at`, `status`, `fetched_count`, `created_count`, `updated_count`, `skipped_count`, `error_message`, `range_from`, `range_to`.

**raw_imports**: `source`, `external_id`, `payload` (jsonb), `file_path` (Storage, for FIT/GPX files), `content_hash` (sha256, **unique per user**), `received_at`, `processed_at`, `error`.

### 4.9 Audit
**audit_log**: `table_name`, `record_id`, `action`, `before` (jsonb), `after` (jsonb), `actor` (`owner` | `system_sync`), `created_at`. Database triggers write to it for `training_programs`, `planned_sessions`, `nutrition_targets` and `goals`.

## 5. Relationships (simplified)

```
profiles ─┬─ goals
          ├─ training_programs ── planned_sessions ──┐
          ├─ activities ◀─────────────────────────────┘
          │     ├─ activity_laps
          │     └─ activity_exercises ── exercise_sets
          │              └─ exercises (reference)
          ├─ personal_records
          ├─ body_metrics
          ├─ wellness_daily
          ├─ nutrition_targets
          ├─ meals ── meal_items
          ├─ ai_recommendations ── ai_change_proposals
          ├─ ai_conversations ── ai_messages
          ├─ data_sources, sync_runs, raw_imports
          └─ audit_log
```

## 6. Storage buckets

- `imports` (private): uploaded FIT and GPX files, at the path `user_id/yyyy/mm/<hash>.fit`.

## 7. Migration order (planned)

1. `0001_profiles_goals.sql`
2. `0002_exercises_activities_sets.sql` + `seed.sql`
3. `0003_body_wellness.sql`
4. `0004_nutrition.sql`
5. `0005_programs_audit.sql`
6. `0006_sources_sync_raw.sql`
7. `0007_ai.sql`

Each migration is added only in the phase that needs it.
