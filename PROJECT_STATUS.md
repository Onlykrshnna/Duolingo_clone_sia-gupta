# PROJECT_STATUS.md

**Project:** Real Duolingo — Duolingo-style language learning web application  
**Last updated:** August 13, 2026  
**Purpose:** Comprehensive technical status report for engineers onboarding without reading the full source tree.

---

# 1. Project Overview

## Overall Architecture

The application is a **decoupled full-stack web app** with a Next.js frontend and a FastAPI backend sharing a single relational database.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│  Next.js 16 App Router · React 19 · Zustand · Tailwind CSS 4   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/JSON  (NEXT_PUBLIC_API_URL)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (port 8000)                     │
│  routes.py · logic.py · schemas.py · SQLAlchemy async ORM        │
└────────────────────────────┬────────────────────────────────────┘
                             │ async SQLAlchemy
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL (Supabase)  OR  SQLite (local)           │
│  Content tables (seeded) + per-learner progress tables          │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow pattern:** The frontend is almost entirely client-rendered (`"use client"` on all pages). Each page fetches data from the REST API on mount. There is no Next.js server-side data fetching layer for business data. Lesson gameplay uses a Zustand store for ephemeral session state; all durable progress is persisted via backend API calls.

**Authentication model:** There is no login. A single **default learner** (`default_learner`, UUID `d0000000-0000-0000-0000-000000000000`) represents the active user. The frontend passes `"me"` as the user ID; the backend resolves it via `get_user_or_default()`.

## Tech Stack

| Layer | Technology | Version / Notes |
|-------|------------|---------------|
| Frontend framework | Next.js (App Router) | 16.3.0 |
| UI library | React | 19.2.8 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x (`@import "tailwindcss"`) |
| Animations | Framer Motion | 13.1.0 (Sidebar drawer, FeedbackBar, word bank, match pairs) |
| Confetti | canvas-confetti | 1.9.4 |
| Toasts | Sonner | 2.0.8 |
| Icons | lucide-react | 1.31.0 |
| Client state | Zustand | 5.0.15 (lesson session only) |
| Backend framework | FastAPI | ≥0.100 |
| ORM | SQLAlchemy (async) | ≥2.0 |
| Migrations | Alembic | ≥1.11 (initial migration present) |
| DB driver (prod) | asyncpg | ≥0.28 |
| DB driver (local) | aiosqlite | Used when Supabase URL absent (not in requirements.txt) |
| Validation | Pydantic v2 | Request/response schemas |
| Tests | pytest | 5 unit tests in `test_logic.py` |
| Font | Nunito via `next/font/google` | Weights 300–900 |

## Folder Structure

```
real-duolingo/
├── frontend/                    # Next.js application
│   ├── public/                  # Static assets (logo, mascot images, flags)
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── layout.tsx       # Root layout + Toaster + ClientBootstrap
│   │   │   ├── globals.css      # Tailwind theme tokens + custom animations
│   │   │   ├── page.tsx         # Learn / home path (/)
│   │   │   ├── lesson/[lessonId]/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── quests/page.tsx
│   │   │   ├── shop/page.tsx
│   │   │   └── sounds/page.tsx
│   │   ├── components/          # Reusable UI
│   │   │   ├── exercises/       # 6 exercise type renderers + ExercisePrompt
│   │   │   └── modals/          # LessonCompleteModal, OutOfHeartsModal
│   │   ├── lib/                 # api.ts, types.ts, exerciseUtils.ts, gamificationToasts.ts
│   │   └── store/               # useLessonStore.ts (Zustand)
│   └── package.json
├── backend/
│   ├── main.py                  # FastAPI entry + CORS + health check
│   ├── routes.py                # All API endpoints (single router)
│   ├── logic.py                 # Pure functions: streak, heart regen, daily XP reset
│   ├── models.py                # SQLAlchemy ORM models
│   ├── schemas.py               # Pydantic response/request models
│   ├── database.py              # Async engine + session dependency
│   ├── config.py                # DATABASE_URL from .env, SQLite fallback
│   ├── seed.py                  # Full database seed (content + default user)
│   ├── reset_learner.py         # Progress-only reset for default learner
│   ├── test_logic.py            # Streak + daily XP reset unit tests
│   ├── test_lesson_progression.py  # Manual integration script (urllib)
│   ├── alembic/                 # Initial migration
│   ├── requirements.txt
│   └── duolingo.db              # Local SQLite file (created at runtime)
├── Duolingo_Clone_PRD.md        # Original scaffold/assignment prompt (partial PRD)
├── etracted_refrence.md         # UI/UX design token reference (conceptual)
└── PROJECT_STATUS.md            # This document
```

## Current Deployment Status

| Environment | Status | Details |
|-------------|--------|---------|
| **Local development** | ✅ Working | Frontend: `npm run dev` (port 3000). Backend: `uvicorn main:app --reload` (port 8000). SQLite fallback when `.env` lacks Supabase URL. |
| **Production frontend** | 🟡 Configured only | CORS allows `https://real-duolingo-frontend.vercel.app` and `*.vercel.app` regex in `main.py`. No verified live deployment documented in repo. |
| **Production backend** | ❌ Not documented | Supabase Postgres supported via `DATABASE_URL` env var. No Docker, CI/CD, or deployment scripts in repo. |
| **Root README** | ❌ Missing | Assignment spec requested `/README.md`; only default Next.js README exists under `frontend/`. |

---

# 2. Frontend

## Pages

| Route | File | Purpose | Data Sources |
|-------|------|---------|--------------|
| `/` | `app/page.tsx` | **Learn / Learning Path** — unit banners, sinuous skill nodes, right rail widgets | `getUserProfile`, `getCoursePath`, `getUserStats`, `getUserQuests`, `getCourses` |
| `/lesson/[lessonId]` | `app/lesson/[lessonId]/page.tsx` | **Lesson player** — exercises, hearts, feedback bar, completion/out-of-hearts modals | `startLesson`, `submitAnswer`, `completeLesson`, `abandonLesson`, `refillHearts` |
| `/profile` | `app/profile/page.tsx` | User profile, stats, achievements, social placeholders | `getUserProfile`, `getCourses` |
| `/leaderboard` | `app/leaderboard/page.tsx` | Bronze League weekly XP rankings | `getLeaderboard`, `getUserStats` |
| `/settings` | `app/settings/page.tsx` | Language course switcher + "Coming Soon" placeholder | `getUserProfile`, `getCourses`, `selectCourse` |
| `/quests` | `app/quests/page.tsx` | Daily quests list with progress bars | `getUserStats`, `getUserQuests` |
| `/shop` | `app/shop/page.tsx` | Hearts refill UI, Super promo, power-ups (mostly static) | `getUserStats` |
| `/sounds` | `app/sounds/page.tsx` | Placeholder "Audio & Sounds Coming Soon" | `getUserStats` |

**Not implemented:** Landing/marketing page (`/` redirects to learn path), dedicated `/courses` route (course selection is a modal overlay), `/learn` alias (home is `/`).

## State Management

| Store / Pattern | Location | Scope | Persistence |
|-----------------|----------|-------|-------------|
| **Zustand `useLessonStore`** | `store/useLessonStore.ts` | Active lesson session: attempt ID, exercise index, selections, hearts, result summary, out-of-hearts flag | In-memory only; reset on unmount and via `ClientBootstrap` |
| **React `useState`** | Every page component | Page-local UI state (loading, errors, fetched API data) | None |
| **URL search params** | Lesson page | `?practice=true` enables practice mode | URL only |

There is **no Zustand persist middleware**, no `localStorage`/`sessionStorage` for progress. `ClientBootstrap` clears any keys prefixed `duolingo`, `duo-`, `lesson-`, or `real-duolingo` on every app launch and calls `resetLesson()`.

## Routing

Next.js **App Router** with file-based routes. All listed pages are client components with `export const dynamic = "force-dynamic"`. Navigation uses `next/link` and `useRouter().push()`. Sidebar highlights active route via `usePathname()`.

## Animations

| Animation | Implementation | Where Used |
|-----------|----------------|------------|
| 3D button press | Tailwind `border-b-4 active:border-b-2 active:translate-y-[2px]` | `DuoButton` |
| Heart shake | CSS `@keyframes shake` → `.animate-shake` | Lesson header on wrong answer |
| Confetti | `canvas-confetti` bursts | `LessonCompleteModal` |
| Fade-in | CSS `.animate-fade-in` | Lesson complete modal |
| Slow spin | CSS `.animate-spin-slow` | Settings "Coming Soon" gear |
| Bounce | Tailwind `animate-bounce` | START badge on path nodes, lesson complete owl |
| Slide-up footer | Framer Motion `y: 100% → 0` | `FeedbackBar` |
| Mobile drawer | Framer Motion spring slide | `Sidebar` |
| Word bank chips | Framer Motion `AnimatePresence` | `ExerciseWordBank` |
| Match pair selection | Framer Motion scale/opacity | `ExerciseMatchPairs` |
| Loading spinners | Tailwind `animate-spin` | All pages during fetch |

**Not implemented:** Sound effects (`correct.wav`, `incorrect.wav`, `finish.mp3`), keyboard number shortcuts for MC options, exit confirmation modal animation.

## UI Libraries

- **Tailwind CSS 4** — primary styling via `@theme` tokens in `globals.css`
- **Framer Motion** — interactive animations (limited usage, not global)
- **Lucide React** — icon set
- **Sonner** — toast notifications
- **canvas-confetti** — celebration effect

No component library (shadcn, MUI, etc.). All UI is custom-built.

## Theme

Dark Duolingo-inspired palette defined in `globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#131F24` | Page background |
| `--foreground` | `#F3F4F6` | Primary text |
| `--color-brand-green` | `#58CC02` | Primary actions, correct states, path nodes |
| `--color-brand-orange` | `#FB923C` | XP, streak, quest progress |
| `--color-sky-blue` | `#38BDF8` | Secondary buttons, active nav |
| `--color-rose-red` | `#F43F5E` | Hearts, errors |
| `--color-dark-card-bg` | `#1F2E35` | Cards, modals |
| `--color-light-border` | `#37464F` | Borders |
| `--color-muted-text` | `#8E9FA8` | Secondary text |

Font: **Nunito** (extrabold headings, semibold body). Border radius: `rounded-xl` (12px), `rounded-2xl` (16px).

Lesson player intentionally uses a **light theme** (`bg-white`) to match Duolingo's exercise screen contrast.

## Reusable Components — Complete Inventory

### Layout & Navigation
| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | `components/Sidebar.tsx` | Fixed 256px desktop nav, mobile hamburger drawer, "More → Settings" dropdown |
| `UserProgress` | `components/UserProgress.tsx` | Top stats bar: flag, streak, daily goal ring, gems, hearts + regen countdown |
| `ClientBootstrap` | `components/ClientBootstrap.tsx` | Clears client storage + resets Zustand on mount |
| `ToasterProvider` | `components/ToasterProvider.tsx` | Sonner toaster with dark theme styling |

### Path & Gamification UI
| Component | File | Description |
|-----------|------|-------------|
| `UnitBanner` | `components/UnitBanner.tsx` | Colored unit header with title/description |
| `LessonButton` | `components/LessonButton.tsx` | Circular path node with lock/START/PRACTICE states, progress ring, crown badge |
| `LanguageSelectModal` | `components/LanguageSelectModal.tsx` | Course grid modal for onboarding and language change |
| `Mascot` | `components/Mascot.tsx` | Owl image + encouragement bubble (standalone, lightly used) |

### Lesson Player
| Component | File | Description |
|-----------|------|-------------|
| `ExercisePrompt` | `components/exercises/ExercisePrompt.tsx` | Owl speech bubble above all exercise types |
| `ExerciseMultipleChoice` | `components/exercises/ExerciseMultipleChoice.tsx` | Option cards with selected/correct/wrong states |
| `ExerciseFillBlank` | `components/exercises/ExerciseFillBlank.tsx` | Sentence with blank + option chips |
| `ExerciseWordBank` | `components/exercises/ExerciseWordBank.tsx` | Tap-to-build sentence from token bank |
| `ExerciseMatchPairs` | `components/exercises/ExerciseMatchPairs.tsx` | Two-column card matching |
| `ExerciseTranslate` | `components/exercises/ExerciseTranslate.tsx` | Free-text translation input |
| `ExerciseTypeAnswer` | `components/exercises/ExerciseTypeAnswer.tsx` | Typed answer input |
| `FeedbackBar` | `components/FeedbackBar.tsx` | Fixed bottom bar: Check / Continue + correct/incorrect feedback |
| `DuoButton` | `components/DuoButton.tsx` | 3D pressed button (primary, secondary, danger, super, ghost, locked variants) |

### Modals
| Component | File | Description |
|-----------|------|-------------|
| `LessonCompleteModal` | `components/modals/LessonCompleteModal.tsx` | Full-screen completion: confetti, XP, hearts lost, streak, daily goal |
| `OutOfHeartsModal` | `components/modals/OutOfHeartsModal.tsx` | Practice / gem refill / leave lesson |

### Utilities (Frontend)
| Module | File | Description |
|--------|------|-------------|
| `api` | `lib/api.ts` | Typed fetch wrapper for all backend endpoints |
| `types` | `lib/types.ts` | TypeScript interfaces mirroring API schemas |
| `normalizeExercise` | `lib/exerciseUtils.ts` | Normalizes exercise metadata with fallbacks to options relation |
| Gamification toasts | `lib/gamificationToasts.ts` | XP, streak milestone, achievement unlocked toast helpers |

---

# 3. Backend

## FastAPI Architecture

Single FastAPI application (`main.py`) mounting one API router (`routes.py`) at prefix `/api/v1`. No separate service layer — business logic lives inline in route handlers with pure helper functions extracted to `logic.py`.

**Dependency injection:** `get_db()` yields async SQLAlchemy sessions per request.

**Cross-cutting concerns:**
- CORS middleware for localhost and Vercel origins
- Lazy sync of heart regeneration and daily XP reset on stats reads
- Default learner resolution for all user-scoped endpoints

## Routers

All routes are in **`backend/routes.py`** under `APIRouter(prefix="/api/v1")`. There are no sub-routers.

## Services

There is no dedicated `services/` package. Responsibilities are split as:

| Module | Role |
|--------|------|
| `routes.py` | HTTP handlers, DB queries, orchestration |
| `logic.py` | Pure, testable business rules (streak, heart regen, daily reset) |
| `models.py` | ORM entity definitions |
| `schemas.py` | API contract validation and serialization |

## Database Layer

- **Engine:** `create_async_engine(DATABASE_URL)` in `database.py` (note: `echo=True` logs all SQL)
- **Sessions:** `async_sessionmaker` with `expire_on_commit=False`
- **Migrations:** Alembic initial migration at `alembic/versions/9d974c6ca9f9_initial_migration.py`
- **Local fallback:** `config.py` uses `sqlite+aiosqlite:///./duolingo.db` when Supabase URL not configured

## Business Logic (`logic.py`)

| Function | Purpose |
|----------|---------|
| `compute_streak(last_activity_date, today, current_streak)` | First activity → 1; same day → unchanged; consecutive day → +1; gap >1 day → reset to 1 |
| `calculate_regenerated_hearts(...)` | 30-minute (1800s) interval per heart; shifts `last_heart_lost_at` forward |
| `should_reset_daily_xp(last_activity_date, today)` | True when calendar day rolled over since last activity |
| `REGEN_INTERVAL_SECONDS` | Constant: 1800 |

## Validation

Pydantic v2 models in `schemas.py` with `from_attributes=True` for ORM serialization. Request bodies: `AnswerRequest`, `SelectCourseRequest`. Exercise metadata aliased from ORM column `exercise_metadata` → JSON field `metadata`.

## Seed System

| Script | Command | Behavior |
|--------|---------|----------|
| `seed.py` | `python seed.py` (from `backend/`, use `.venv`) | Truncates all tables, recreates schema via `create_all`, seeds full content + default learner + bots |
| `reset_learner.py` | `python reset_learner.py` | Clears **only** default learner progress; preserves all course content and bot leaderboard entries |

**Seeded content summary:**

| Course | Units | Skills | Lessons | Exercises per lesson |
|--------|-------|--------|---------|---------------------|
| Spanish (primary) | 2 | 6 (3 per unit) | 4 per skill (2 levels × 2 lessons) | 6 (all types) |
| French | 2 | 4 | 1 per skill | 3 (MC, fill_blank, word_bank) |
| German | 2 | 4 | 1 per skill | 3 |
| Japanese | 2 | 4 | 1 per skill | 3 |

**Total skills across all courses:** 18  
**Achievements seeded:** 2 (`first_lesson`, `7_day_streak`)  
**Quests seeded:** 2 (`Earn 20 XP`, `Complete 1 lesson`)  
**Leaderboard:** 9 entries (8 bots + default learner)

Default learner is seeded in **fresh first-time state**: 0 XP, 0 streak, 500 gems, 5 hearts, no skill progress, `active_course_id = NULL`.

## API Endpoints — Complete List

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/v1/health` | `main.py` | Health check (outside router) |
| GET | `/api/v1/courses` | `get_courses` | List all courses |
| GET | `/api/v1/courses/{course_id}/path` | `get_course_path` | Units + skills with lock/progress state for default learner |
| GET | `/api/v1/skills/{skill_id}` | `get_skill` | Single skill with progress |
| GET | `/api/v1/lessons/{lesson_id}` | `get_lesson` | Lesson + exercises + options (eager loaded) |
| POST | `/api/v1/lessons/{lesson_id}/start` | `start_lesson` | Create attempt; blocks if 0 hearts (non-practice) |
| POST | `/api/v1/lessons/attempts/{attempt_id}/answer` | `submit_answer` | Validate answer; deduct heart on wrong (non-practice) |
| POST | `/api/v1/lessons/attempts/{attempt_id}/complete` | `complete_lesson` | Award XP, update streak, skill progress, achievements, quests, leaderboard |
| POST | `/api/v1/lessons/attempts/{attempt_id}/abandon` | `abandon_lesson` | Mark attempt failed, no XP |
| GET | `/api/v1/users/{user_id}/stats` | `get_user_stats` | Stats with lazy heart regen + daily XP reset |
| POST | `/api/v1/users/{user_id}/hearts/refill` | `refill_hearts` | Spend 10 gems → full hearts |
| GET | `/api/v1/users/{user_id}/hearts/regen-status` | `get_hearts_regen_status` | Current hearts + seconds until next regen |
| GET | `/api/v1/leaderboard` | `get_leaderboard` | All entries sorted by `weekly_xp`, ranks recalculated |
| GET | `/api/v1/users/{user_id}/achievements` | `get_user_achievements` | All achievements with unlock status |
| GET | `/api/v1/users/{user_id}/profile` | `get_user_profile` | Full profile + stats + achievements + course summary |
| GET | `/api/v1/users/{user_id}/quests` | `get_user_quests` | Today's quest progress (auto-creates rows) |
| POST | `/api/v1/users/{user_id}/select-course` | `select_course` | Set `users.active_course_id` |

Interactive API docs: `http://localhost:8000/docs`

---

# 4. Database

## Tables Overview

### Content Tables (seeded, read-mostly)

#### `courses`
| Field | Details |
|-------|---------|
| **Purpose** | Top-level language tracks (Spanish, French, German, Japanese) |
| **Primary key** | `id` (UUID) |
| **Relationships** | One-to-many → `units` |
| **Important fields** | `title`, `language_code`, `flag_icon`, `created_at` |

#### `units`
| Field | Details |
|-------|---------|
| **Purpose** | Chapter groupings within a course |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `courses`; one-to-many → `skills` |
| **Important fields** | `order_index`, `title`, `description`, `color_theme` (hex) |

#### `skills`
| Field | Details |
|-------|---------|
| **Purpose** | Path nodes (e.g., Greetings, Travel Basics) |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `units`; one-to-many → `lessons` |
| **Important fields** | `order_index`, `icon`, `total_levels`, `lessons_per_level` |

#### `lessons`
| Field | Details |
|-------|---------|
| **Purpose** | Individual lesson instances within a skill level |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `skills`; one-to-many → `exercises` |
| **Important fields** | `level`, `order_index`, `xp_reward` (default 15) |

#### `exercises`
| Field | Details |
|-------|---------|
| **Purpose** | Individual questions/challenges within a lesson |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `lessons`; one-to-many → `exercise_options` |
| **Important fields** | `type` (enum: 6 types), `prompt`, `correct_answer` (JSON), `metadata` (JSON, ORM: `exercise_metadata`), `prompt_audio_url` (nullable, unused) |

#### `exercise_options`
| Field | Details |
|-------|---------|
| **Purpose** | MC options, word bank tokens, match-pair labels |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `exercises` |
| **Important fields** | `label`, `is_correct`, `pair_key` (match_pairs), `order_index` |

### User & Progress Tables (mutable)

#### `users`
| Field | Details |
|-------|---------|
| **Purpose** | Learner accounts (single default learner in practice) |
| **Primary key** | `id` (UUID) |
| **Relationships** | One-to-one → `user_stats`, `leaderboard_entry`; one-to-many → progress, attempts, achievements |
| **Important fields** | `username`, `display_name`, `avatar_url`, `is_default_learner`, `active_course_id` (FK → courses, nullable) |

#### `user_stats`
| Field | Details |
|-------|---------|
| **Purpose** | Aggregated gamification stats per user |
| **Primary key** | `user_id` (FK → users) |
| **Relationships** | One-to-one → `users` |
| **Important fields** | `total_xp`, `current_streak`, `longest_streak`, `last_activity_date`, `hearts_current`/`hearts_max` (5), `last_heart_lost_at`, `gems` (default 500), `daily_xp_goal` (20), `daily_xp_today` |

#### `user_skill_progress`
| Field | Details |
|-------|---------|
| **Purpose** | Per-skill level and completion tracking |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `users`, `skills` |
| **Important fields** | `current_level`, `status` (enum: locked/available/in_progress/completed), `lessons_completed`, `updated_at` |

#### `user_lesson_attempts`
| Field | Details |
|-------|---------|
| **Purpose** | Lesson session history |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `users`, `lessons` |
| **Important fields** | `started_at`, `completed_at`, `xp_earned`, `hearts_lost`, `result` (passed/failed/in_progress), `is_practice` |

#### `user_achievements`
| Field | Details |
|-------|---------|
| **Purpose** | Junction: which achievements a user unlocked |
| **Primary key** | Composite (`user_id`, `achievement_id`) |
| **Relationships** | Many-to-one → `users`, `achievements` |
| **Important fields** | `unlocked_at` |

#### `user_quest_progress`
| Field | Details |
|-------|---------|
| **Purpose** | Daily quest progress per user |
| **Primary key** | `id` (UUID) |
| **Relationships** | Many-to-one → `users`, `quests` |
| **Important fields** | `progress`, `completed`, `date` |

### Gamification & Meta Tables

#### `leaderboard_entries`
| Field | Details |
|-------|---------|
| **Purpose** | Weekly XP rankings (bots + default learner) |
| **Primary key** | `id` (UUID) |
| **Relationships** | Optional FK → `users` (null for bots) |
| **Important fields** | `display_name`, `avatar_url`, `weekly_xp`, `league`, `rank` |

#### `achievements`
| Field | Details |
|-------|---------|
| **Purpose** | Achievement definitions |
| **Primary key** | `id` (UUID) |
| **Relationships** | One-to-many → `user_achievements` |
| **Important fields** | `key`, `title`, `description`, `icon` |

#### `quests`
| Field | Details |
|-------|---------|
| **Purpose** | Daily quest definitions |
| **Primary key** | `id` (UUID) |
| **Relationships** | One-to-many → `user_quest_progress` |
| **Important fields** | `title`, `description`, `xp_target`, `quest_type` (`xp` or `lesson`) |

---

# 5. Authentication

There is **no authentication system**. The app simulates a logged-in user:

1. **Database:** One user row with `is_default_learner = true`:
   - ID: `d0000000-0000-0000-0000-000000000000`
   - Username: `default_learner`
   - Display name: `Duo Learner`

2. **Backend resolution:** `get_user_or_default(db, user_id_str)`:
   - If `user_id_str` is a valid UUID matching a user → use that user
   - Otherwise (including `"me"`) → query `User.is_default_learner == True`

3. **Frontend:** All API calls use `userId = "me"` default parameter in `api.ts`.

4. **Lesson endpoints:** `start_lesson` hardcodes default learner lookup (does not accept user ID param).

5. **Course path:** `get_course_path` always reads progress for the default learner.

**Implication:** Multi-user support would require auth middleware, user-scoped path queries, and removing hardcoded default learner lookups.

---

# 6. Lesson System

## Lesson Loading

1. User clicks `LessonButton` → `router.push(/lesson/{nextLessonId})` (optional `?practice=true`)
2. `LessonPage` calls `useLessonStore.startLesson(lessonId, isPractice)`
3. `startLesson` POSTs `/lessons/{id}/start` → receives `attempt_id`
4. GET `/lessons/{id}` → loads exercises with options
5. Fetches user stats for initial hearts and `streakAtStart` (for milestone toasts)

## Exercise Flow

```
For each exercise (currentIndex):
  1. Render via normalizeExercise() + type switch
  2. User selects answer → local Zustand state
  3. "Check Answer" → POST /attempts/{id}/answer
  4. FeedbackBar shows correct/incorrect
  5. "Continue" → nextExercise()
     - If hearts = 0 → OutOfHeartsModal
     - If last exercise → completeLesson API
     - Else → increment currentIndex, reset selections
```

## Answer Validation

**Backend:** Strict JSON equality: `exercise.correct_answer == payload.submitted_answer`

**Frontend submission shapes by type:**
| Type | Submitted shape |
|------|-----------------|
| multiple_choice, fill_blank | `{ selected: string }` |
| type_answer | `{ text: string }` (lowercased client-side) |
| translate | `{ translation: string }` (trimmed) |
| word_bank | `{ words: string[] }` |
| match_pairs | `{ pairs: Record<string, string> }` |

## XP Calculation

- **Normal lesson:** `lesson.xp_reward` (15 XP per lesson in seed data) awarded once on `complete_lesson`
- **Practice lesson:** 0 XP; full heart refill on completion
- XP added to: `user_stats.total_xp`, `user_stats.daily_xp_today`, `leaderboard_entries.weekly_xp`

## Heart Deduction

- Wrong answer in non-practice mode: `hearts_current -= 1`, sets `last_heart_lost_at` when dropping below max
- Practice mode: no deduction
- Cannot start lesson with 0 hearts (HTTP 400) unless `is_practice=true`

## Lesson Completion

`complete_lesson` performs atomically:
1. Mark attempt `passed`, set `xp_earned`
2. Update streak via `compute_streak()`
3. Increment `user_skill_progress.lessons_completed`; level up when `lessons_completed >= lessons_per_level`
4. Mark skill `completed` when `current_level >= total_levels`
5. Unlock achievements (`first_lesson` always; `7_day_streak` if streak ≥ 7)
6. Update daily quest progress
7. Increment leaderboard weekly XP

Frontend shows `LessonCompleteModal` with confetti + gamification toasts.

---

# 7. Gamification

## XP
- Earned on lesson completion (not per exercise)
- Displayed in profile, UserProgress (optional `totalXp`), lesson complete modal
- Persisted in `user_stats.total_xp` and `leaderboard_entries.weekly_xp`

## Hearts
- Max 5 (configurable via `hearts_max`)
- Lost on wrong answers (non-practice)
- Refill: 10 gems via API or complete practice lesson (full refill)
- Regeneration: 1 heart per 30 minutes (lazy sync on stats read)
- UI: heart icons in lesson header, UserProgress with countdown timer

## Streak Logic
- Computed on lesson complete in `logic.compute_streak()`
- First-ever activity → streak 1
- Same calendar day → no change
- Consecutive day → +1
- Gap > 1 day → reset to 1
- `longest_streak` tracks personal best
- Tested with 5 pytest cases

## Daily Goals
- Goal: 20 XP (`daily_xp_goal`)
- Progress: `daily_xp_today` incremented on lesson complete
- Resets lazily when `last_activity_date < today`
- UI: circular progress ring in UserProgress; bar in LessonCompleteModal

## Leaderboard
- 9 seeded entries (8 bots + default learner)
- Sorted by `weekly_xp` descending
- Ranks recalculated on every GET (in-memory)
- Frontend highlights current user row
- Uses weekly XP, not lifetime total XP

## Gems
- Default 500 on seed
- Spent: 10 gems for heart refill
- Earned: not implemented (no gem rewards from quests)
- Displayed in UserProgress header

## Progress Rings
- **Path nodes:** SVG circular ring on active skills when `lessons_completed > 0` within current level
- **Daily goal:** SVG ring in UserProgress
- **Quest bars:** Horizontal bars on home and quests pages

## Skill Unlocking
Dynamic computation in `get_course_path` (no DB rows needed for locked skills):
1. First skill in course order starts as `available` when no progress exists
2. Completing a skill (status `completed` or `current_level >= total_levels`) unlocks the next
3. All subsequent unstarted skills remain `locked`
4. In-progress skills show partial ring fill based on `lessons_completed / lessons_per_level`

---

# 8. Current Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Learning Path** | ✅ Completed | Sinuous SVG path, unit banners, dynamic lock states, 4 courses |
| **Lessons** | ✅ Completed | Full player with progress bar, 6 exercise types on Spanish |
| **Exercise Types** | ✅ Completed | MC, fill_blank, word_bank, match_pairs, translate, type_answer |
| **Feedback Bar** | 🟡 Partially Complete | Check/Continue works; wrong answers advance instead of retry; no Retry label |
| **Hearts** | ✅ Completed | Deduction, display, shake animation, 0-hearts blocking |
| **XP** | ✅ Completed | Per-lesson reward, persistence, display |
| **Streak** | ✅ Completed | Backend logic + display; milestone toasts at 3/7/14/30/50/100 |
| **Daily Goal** | ✅ Completed | Tracking + UI ring + lesson complete summary |
| **Leaderboard** | ✅ Completed | Live API data, user highlight; uses weekly XP not total |
| **Profile** | ✅ Completed | Real API data, achievements, stats; social tabs are placeholder |
| **Settings** | 🟡 Partially Complete | Coming Soon card + working language switcher |
| **Practice Mode** | 🟡 Partially Complete | `?practice=true` works; no practice warning modal; full heart refill not +1 per answer |
| **Heart Regeneration** | ✅ Completed | 30-min timer, lazy sync, countdown in UserProgress |
| **Achievements** | 🟡 Partially Complete | 2 achievements, unlock on complete; profile display works |
| **Confetti** | ✅ Completed | canvas-confetti on lesson complete |
| **Toasts** | ✅ Completed | Sonner: XP, streak milestones, achievements, heart refill |
| **Modals** | 🟡 Partially Complete | Language select, lesson complete, out of hearts; no exit modal |
| **Responsive Design** | 🟡 Partially Complete | Mobile sidebar drawer; right rail hidden on mobile; lesson player responsive |
| **Persistence** | ✅ Completed | All progress in DB; client state cleared on launch |
| **Seed Data** | ✅ Completed | 4 courses, 18 skills, Spanish full exercises, bots, quests, achievements |

---

# 9. UI/UX

## Duolingo Screens Recreated

| Duolingo Screen | Implementation | Fidelity |
|-----------------|----------------|----------|
| Learn / Path | `/` with dark theme, sinuous path, unit banners | High |
| Lesson player | `/lesson/[id]` light theme, owl prompt, feedback bar | Medium-High |
| Language selection | Modal overlay (not `/courses` page) | Medium |
| Leaderboard | `/leaderboard` Bronze League | Medium |
| Quests | `/quests` with daily quest cards | Medium |
| Shop | `/shop` hearts + Super promos | Medium (mostly static) |
| Profile | `/profile` stats + achievements | Medium |
| Settings | `/settings` placeholder + language | Low-Medium |
| Sounds | `/sounds` placeholder | Low |
| Lesson complete | Full-screen modal + confetti | High |
| Out of hearts | Modal with practice/refill/leave | High |
| Landing / marketing | ❌ Not implemented | — |
| Exit lesson confirmation | ❌ Not implemented | — |
| Super / Pro subscription | Promo cards only (no Stripe) | Low |

## Remaining Polish Work

1. Wrong-answer retry flow (same exercise, "Retry" button)
2. Exit lesson confirmation modal ("Wait, don't go!")
3. Practice mode intro modal before starting
4. Sound effects on correct/incorrect/finish
5. Keyboard shortcuts (1/2/3 for options, Enter throughout)
6. Fix first skill showing "PRACTICE" bubble for new users (`isFirstUnitNode` logic)
7. Shop page: wire gem refill button to API; use dynamic course flag
8. Quests page: use API `xp_target` instead of hardcoded `10`
9. Toast timing relative to full-screen completion modal
10. Out-of-hearts modal immediately when last heart lost (optional UX)
11. Landing/marketing page for unauthenticated entry
12. Light theme on path page vs reference white sidebar (intentional dark theme deviation)

## Missing Animations

- Option card audio play on select
- Lesson node bouncing START bubble (partial — uses CSS bounce)
- 500-particle 10-second confetti (current: shorter burst)
- Page transition animations
- Streak flame celebration overlay
- Legendary / crown level-up animation

## Differences from Duolingo

| Area | Duolingo | This App |
|------|----------|----------|
| Theme | Mixed light/dark | Dark shell, light lesson player |
| Auth | Full accounts | Single default learner |
| XP | Per exercise + lesson bonus | Per lesson only (15 XP) |
| Wrong answers | Retry same question | Advances to next question |
| Practice hearts | +1 per correct answer | Full refill on complete |
| Leaderboard | League promotion system | Static Bronze League list |
| Gems economy | Earned from quests/achievements | Starting balance only |
| Audio | Pronunciation on every tap | No audio playback |
| Payments | Stripe Super subscription | Static promo buttons |
| Content depth | Thousands of skills | 18 skills, Spanish richest |

---

# 10. Code Quality

## Folder Organization

**Strengths:**
- Clear frontend/backend split
- Exercise types isolated in `components/exercises/`
- Modals in `components/modals/`
- Shared types and API client in `lib/`
- Pure business logic extracted to `logic.py`

**Weaknesses:**
- All backend routes in one 880-line `routes.py` file
- No `services/` layer — route handlers are thick
- Some pages duplicate right-rail widget markup (quests, shop promos)
- Shop/quests/sounds hardcode `activeCourseFlag="🇺🇸"` instead of fetching profile

## Reusable Components

`DuoButton`, `UserProgress`, `Sidebar`, `FeedbackBar`, `ExercisePrompt`, and exercise renderers are genuinely reused. Page-level layouts (sidebar + main + aside) are copy-pasted across 7 pages rather than extracted into a `AppLayout` wrapper.

## Separation of Concerns

| Layer | Assessment |
|-------|------------|
| Frontend data fetching | Each page owns fetch logic — no shared hooks (`useUserStats`, etc.) |
| Backend | Routes mix HTTP, DB, and business rules; only streak/regen are pure |
| Types | Frontend `types.ts` mirrors backend schemas manually (no codegen) |

## Type Safety

- TypeScript throughout frontend with explicit interfaces
- Pydantic validation on all API boundaries
- Some `any` types: `correctAnswer`, `submittedAnswer`, error handlers
- Exercise `metadata` typed as `any`

## Performance Optimizations

**Present:**
- `selectinload` for lesson exercises/options
- Bulk lesson fetch in path endpoint
- Lazy heart regen (computed on read, not background job)
- Path reload on tab visibility change only

**Missing:**
- No React Query / SWR caching
- UserProgress polls heart regen every 1 second
- `database.py` has `echo=True` (verbose SQL logging)
- No pagination (acceptable at current data scale)
- No image optimization config beyond Next.js defaults

## Test Coverage

| Test | Location | Coverage |
|------|----------|----------|
| Streak logic (4 cases) | `test_logic.py` | ✅ |
| Daily XP reset (1 case) | `test_logic.py` | ✅ |
| Lesson progression E2E | `test_lesson_progression.py` | Manual script, not pytest |
| Frontend tests | — | ❌ None |
| API integration tests | — | ❌ None |

---

# 11. Remaining Tasks

## Critical (blocks core assignment expectations)

- [ ] Fix wrong-answer flow: retry same exercise instead of advancing (`FeedbackBar` + `nextExercise` logic)
- [ ] Add exit lesson confirmation modal (prevent accidental X click data loss)
- [ ] Wire shop "Refill Hearts" button to `api.refillHearts()` with dynamic disabled/full states
- [ ] Fix quests page to read `quest.xp_target` from API (currently hardcoded to 10)
- [ ] Remove erroneous "PRACTICE" bubble on first skill for brand-new users
- [ ] Add root `README.md` with setup instructions (backend venv, seed, env vars, run commands)
- [ ] Add `aiosqlite` to `backend/requirements.txt` for local SQLite support

## Important (submission polish)

- [ ] Practice mode intro modal ("Practice lesson — no hearts lost")
- [ ] Sound effects (correct, incorrect, finish) — static files in `public/`
- [ ] Keyboard shortcuts: Enter (exists), 1/2/3 for MC options
- [ ] Extract shared `AppLayout` component to DRY page shells
- [ ] Fix hardcoded `🇺🇸` flags on shop/quests/sounds pages
- [ ] Delay or reposition toasts so they aren't obscured by full-screen completion modal
- [ ] Set `echo=False` in `database.py` for non-dev environments
- [ ] Verify production deployment (Vercel frontend + hosted backend + Supabase)
- [ ] Add frontend environment example (`.env.local.example`)

## Nice to Have

- [ ] Landing/marketing page with "Get Started" → language modal
- [ ] `/courses` dedicated route (currently modal-only)
- [ ] More achievements and quest types
- [ ] Gem rewards from completed quests
- [ ] League promotion/demotion logic
- [ ] Per-exercise XP (+10 per challenge as in reference spec)
- [ ] Audio pronunciation (`prompt_audio_url` field support)
- [ ] Framer Motion page transitions
- [ ] React Query for API caching and deduplication
- [ ] Split `routes.py` into domain routers (content, lessons, users)
- [ ] Auto-generated TypeScript types from OpenAPI schema
- [ ] CI pipeline running pytest + `tsc` + `next build`
- [ ] E2E tests with Playwright

---

# 12. Assignment Checklist

Based on `Duolingo_Clone_PRD.md` (scaffold prompt), `etracted_refrence.md` (UI spec), and implemented functionality.

| Requirement | Status | Explanation |
|-------------|--------|-------------|
| Next.js 14+ App Router + TypeScript | ✅ Complete | Next.js 16, all pages use App Router |
| Tailwind CSS | ✅ Complete | Tailwind 4 with custom theme tokens |
| Framer Motion animations | 🟡 Partial | Used in Sidebar, FeedbackBar, some exercises; not comprehensive |
| Zustand for lesson session state | ✅ Complete | `useLessonStore.ts` |
| FastAPI backend | ✅ Complete | Full REST API |
| SQLAlchemy async ORM | ✅ Complete | All models + async sessions |
| Alembic migrations | ✅ Complete | Initial migration exists |
| Supabase Postgres support | 🟡 Partial | Configured via env; local dev uses SQLite fallback |
| No AI/LLM features | ✅ Complete | None present |
| No third-party auth | ✅ Complete | Default learner only |
| No payment integration | ✅ Complete | Shop/Super buttons are static mocks |
| Database schema (all PRD tables) | ✅ Complete | All 15 tables implemented |
| Pages: `/`, `/lesson/[id]`, `/profile`, `/leaderboard`, `/settings` | ✅ Complete | All exist and functional |
| Pages: `/quests`, `/shop` | ✅ Complete | Implemented beyond minimum PRD list |
| DuoButton 3D pressed style | ✅ Complete | 6 variants |
| Nunito font | ✅ Complete | Via next/font |
| Design tokens from reference | 🟡 Partial | Colors adapted to dark theme; spacing close |
| Seed data | ✅ Complete | 4 courses, rich Spanish content |
| Learning path with skill locking | ✅ Complete | Dynamic first-skill unlock |
| 6 exercise types | ✅ Complete | All types in Spanish lessons |
| Lesson complete screen | ✅ Complete | Modal with confetti + stats |
| Hearts system | ✅ Complete | Deduction, refill, regen |
| Streak tracking | ✅ Complete | Backend + UI (reference said none — exceeded spec) |
| Leaderboard top 10 | ✅ Complete | 9 entries seeded |
| Daily quests | 🟡 Partial | Backend tracks; UI partially hardcoded |
| Practice mode | 🟡 Partial | Works via query param; missing intro modal and per-answer heart restore |
| Shop gem refill | 🟡 Partial | API exists; shop UI button disabled/static |
| Project README | ❌ Missing | Not created at repo root |
| `.env.example` files | 🟡 Partial | Referenced in PRD; verify presence |

---

# 13. Known Bugs

### BUG-1: Wrong answers advance to next exercise
**Severity:** High  
**Reproduction:**
1. Start any lesson
2. Deliberately answer incorrectly
3. Click "Continue" on red feedback bar
4. Observe next exercise loads instead of resetting current one

**Expected (per reference spec):** Retry same challenge with cleared selection.  
**Location:** `FeedbackBar.tsx` always calls `onNext`; `useLessonStore.nextExercise` always increments index.

---

### BUG-2: First skill shows "PRACTICE" bubble for new users
**Severity:** Medium  
**Reproduction:**
1. Reset learner (`python reset_learner.py`)
2. Select a course, view path
3. First node (Greetings) shows orange "PRACTICE" label despite never being completed

**Cause:** `LessonButton` renders PRACTICE when `isFirstUnitNode === true` regardless of completion status.  
**Location:** `LessonButton.tsx` line ~174

---

### BUG-3: Quests page hardcodes XP target as 10
**Severity:** Medium  
**Reproduction:**
1. Visit `/quests`
2. Progress bar shows `X / 10` even though seeded quest target is 20 XP

**Location:** `quests/page.tsx` — `const targetXp = 10`

---

### BUG-4: Shop/Quests/Sounds pages use hardcoded US flag
**Severity:** Low  
**Reproduction:** Complete a course in Spanish; visit `/shop` — sidebar shows 🇺🇸 instead of active course flag.

**Location:** `shop/page.tsx`, `quests/page.tsx`, `sounds/page.tsx`

---

### BUG-5: Shop refill button always disabled / shows "FULL"
**Severity:** Medium  
**Reproduction:**
1. Lose hearts in a lesson
2. Visit `/shop`
3. "Refill Hearts" button remains disabled with "FULL" label

**Location:** `shop/page.tsx` — button has `disabled` hardcoded, no API integration

---

### BUG-6: Toasts may be hidden behind lesson complete modal
**Severity:** Low  
**Reproduction:** Complete a lesson; XP/streak toasts fire simultaneously with full-screen `#131F24` modal overlay.

**Location:** `LessonCompleteModal.tsx` + `gamificationToasts.ts`

---

### BUG-7: Out-of-hearts modal delayed until Continue click
**Severity:** Low  
**Reproduction:** Lose last heart on wrong answer; feedback bar still visible until user clicks Continue.

**Note:** May be intentional (show feedback first) but differs from immediate block described in some specs.

---

### BUG-8: `requirements.txt` missing `aiosqlite`
**Severity:** Medium (local dev)  
Fresh venv install fails for SQLite fallback unless `aiosqlite` installed manually.

---

### BUG-9: Answer validation case sensitivity inconsistency
**Severity:** Low  
`type_answer` lowercases client-side before submit; `translate` does not. Backend uses strict equality.

---

### BUG-10: Console debug logging in production lesson player
**Severity:** Low  
`lesson/[lessonId]/page.tsx` logs every exercise render to console.

---

# 14. Suggested Improvements

1. **OpenAPI → TypeScript codegen** — eliminate manual type drift between `schemas.py` and `types.ts`
2. **Shared layout component** — `AppShell({ children, showRightRail })` to deduplicate 7 pages
3. **Custom React hooks** — `useUserProfile()`, `useCoursePath()` with shared error/loading patterns
4. **SWR or TanStack Query** — cache stats across pages, reduce redundant fetches
5. **Background heart regen job** — optional cron instead of lazy-only sync
6. **Weekly leaderboard reset** — cron to zero `weekly_xp` every Monday
7. **Exercise attempt tracking** — per-exercise completion table for analytics and spaced repetition
8. **Legendary skills** — crown levels beyond base completion
9. **Streak freeze shop item** — UI exists in shop, backend not wired
10. **Internationalization** — course content is multi-language but UI strings are English-only
11. **Accessibility audit** — keyboard nav, ARIA labels on path nodes, focus management in modals
12. **Docker Compose** — one-command local dev (frontend + backend + postgres)
13. **Structured logging** — replace print/SQL echo with proper logging levels
14. **Rate limiting** — protect API endpoints if deployed publicly

---

# 15. Final Readiness Score

## Score Breakdown

| Category | Score (/100) | Rationale |
|----------|-------------|-----------|
| **UI** | 78 | Strong dark-theme path and lesson UI; placeholders on sounds/settings; missing landing page; some hardcoded widgets |
| **Backend** | 85 | Complete API surface, solid gamification logic, good seed/reset tooling; monolithic routes file |
| **Database** | 88 | Full normalized schema, migrations, comprehensive seed, progress reset script |
| **Architecture** | 80 | Clean frontend/backend split; lacks service layer, shared hooks, and layout abstraction |
| **Code Quality** | 74 | TypeScript + Pydantic throughout; duplication across pages; minimal automated tests |
| **UX** | 72 | Core loop playable and polished modals; wrong-answer retry missing; no sounds; practice bubble bug |
| **Feature Completeness** | 76 | All major Duolingo loops present; shop/quests/practice partially wired; no auth/payments by design |

### **Overall Readiness: 79 / 100**

The project demonstrates a working end-to-end language learning application with real database persistence, multiple exercise types, gamification, and Duolingo-inspired visual design. It is **approaching submission-ready** but needs critical bug fixes (wrong-answer retry, shop refill wiring, quests target) and documentation (root README) before being considered complete against the assignment spec.

## Estimated Remaining Work

| Priority bucket | Hours estimate |
|-----------------|----------------|
| Critical fixes + README | 4–6 hours |
| Important polish (sounds, exit modal, layout DRY, deployment) | 6–10 hours |
| Nice-to-have (landing page, CI, E2E tests) | 10–20 hours |

**Total to submission-ready (Critical + Important):** approximately **10–16 hours**  
**Total to production-polished (all buckets):** approximately **20–36 hours**

---

## Quick Start Reference

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt aiosqlite
python seed.py                # First-time full seed
python reset_learner.py       # Reset progress only
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

Default learner after reset: 0 XP, 0 streak, 5 hearts, 500 gems, language selection modal on home.

---

*End of PROJECT_STATUS.md*
