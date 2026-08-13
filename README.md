# Duolingo Clone — Fullstack Language Learning App

A Duolingo-style language learning web application built as a graded fullstack assignment. Learners follow a skill tree, complete interactive lessons, earn XP, maintain streaks, and compete on a weekly leaderboard.

## Architecture

```
Browser (Next.js 16 + React 19 + Zustand + Tailwind CSS 4)
        │  HTTP/JSON  (NEXT_PUBLIC_API_URL)
        ▼
FastAPI Backend (Python, async SQLAlchemy)
        │
        ▼
SQLite (local)  or  PostgreSQL via DATABASE_URL
```

- **Frontend:** Client-rendered App Router pages; Zustand for lesson session state; durable progress via REST API.
- **Backend:** FastAPI monolith with domain logic in `routes.py`, `logic.py`, `path_builder.py`, and `learning_engine/`.
- **Auth:** Single default learner (`default_learner` / API alias `"me"`). No login flow.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, Framer Motion, Zustand |
| Backend | FastAPI, SQLAlchemy 2 (async), Pydantic v2, Alembic |
| Database | SQLite (default local), PostgreSQL supported via env |
| Tests | pytest (`backend/test_logic.py`) |

## Folder Structure

```
/
├── frontend/                 # Next.js application
│   └── src/
│       ├── app/              # Routes: /, /lesson/[id], /profile, /leaderboard, …
│       ├── components/       # UI + exercise renderers + modals
│       ├── lib/              # api.ts, lessonEngine/, audio/
│       └── store/            # Zustand stores
├── backend/
│   ├── main.py               # FastAPI entry + CORS
│   ├── routes.py             # REST API endpoints
│   ├── models.py             # SQLAlchemy ORM models
│   ├── seed.py               # Database seed script
│   └── learning_engine/      # Lesson generation & scheduling
└── README.md
```

## Database Schema

Core content hierarchy:

`Course → Unit → Skill → Lesson → Exercise → ExerciseOption`

Learner progress:

| Table | Purpose |
|-------|---------|
| `users` | Default learner profile |
| `user_stats` | XP, streak, hearts, gems, daily goal |
| `user_courses` | Per-course enrollment & hearts |
| `user_skill_progress` | Skill lock/unlock & completion |
| `user_lesson_attempts` | Lesson session records |
| `leaderboard_entries` | Weekly XP rankings |
| `quests` / `user_quest_progress` | Daily quests |
| `achievements` / `user_achievements` | Gamification badges |

## API Overview

Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/courses` | List courses |
| GET | `/courses/{id}/path` | Learning path with skill states |
| POST | `/courses/{id}/lessons/{lessonId}/start` | Start lesson attempt |
| POST | `/lessons/attempts/{id}/answer` | Submit exercise answer |
| POST | `/lessons/attempts/{id}/complete` | Complete lesson |
| GET | `/users/me/stats` | XP, streak, hearts, gems |
| POST | `/users/me/hearts/refill` | Refill hearts (10 gems) |
| GET | `/leaderboard` | Weekly top 10 |
| GET | `/users/me/profile` | Profile + achievements |
| GET | `/users/me/quests` | Daily quest progress |
| POST | `/users/me/switch-course` | Switch active course |

Interactive docs: `http://localhost:8000/docs`

## Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- npm

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # optional; SQLite used if DATABASE_URL unset

python seed.py
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seed Data

`python backend/seed.py` creates:

- **4 full courses:** Spanish, French, German, Japanese (units, skills, lessons, exercises)
- **Default learner** with 500 gems, 5 hearts, enrolled in all courses
- **Leaderboard** entries, daily quests, achievements

Reset learner progress only:

```bash
cd backend
python reset_learner.py
```

## Build & Validation

```bash
cd frontend
npm run build
npm run lint
npm run type-check
```

```bash
cd backend
pytest test_logic.py -q
```

## Deployment

### Frontend (Vercel)

1. Set root directory to `frontend`
2. Environment: `NEXT_PUBLIC_API_URL=https://your-api.example.com/api/v1`
3. Deploy

CORS in `backend/main.py` allows `*.vercel.app`.

### Backend

1. Deploy FastAPI (Railway, Render, Fly.io, etc.)
2. Set `DATABASE_URL` for PostgreSQL, or use bundled SQLite for demos
3. Run `python seed.py` once on the target database

## Screenshots

<!-- Add screenshots here after deployment -->
| Home / Learning Path | Lesson Player | Leaderboard |
|---------------------|---------------|-------------|
| _screenshot_ | _screenshot_ | _screenshot_ |

## Assumptions

- Single anonymous learner (no auth) matches assignment spec
- Shop Super/payment features are static UI mocks
- `/sounds` is a placeholder page
- UI inspired by Duolingo design tokens; not a pixel-perfect clone

## Known Limitations

- Italian/Portuguese courses exist as shells without lesson content
- Hearts refill uses global `user_stats` (not per-course `user_courses`)
- Leaderboard and quests are global, not per-course
- No E2E test suite; manual QA recommended before demo
- Audio uses Web Speech TTS; `prompt_audio_url` file playback not wired

## License

Educational assignment project.
