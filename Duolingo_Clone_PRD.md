I'm building an original Duolingo-style language learning web app from 
scratch as a graded fullstack assignment. This is a NEW, independent 
codebase — do not reference, copy, or reuse code patterns from any 
existing Duolingo clone repository.

I have two spec documents in the project root:
- `Duolingo_Clone_PRD.md` — the full product requirements, tech stack, 
  database schema, API design, and feature list
- `extracted_reference.md` — a conceptual UI/UX and design-token reference 
  (colors, fonts, layout patterns, component behavior) written in plain 
  English, to be used as visual/structural inspiration only

Read both files fully before doing anything else.

TECH STACK (follow exactly, do not substitute):
- Frontend: Next.js 14+ (App Router, TypeScript), Tailwind CSS, 
  Framer Motion for animations, Zustand for lesson-session state
- Backend: FastAPI (Python), SQLAlchemy (async) as ORM, Alembic for migrations
- Database: Supabase (managed Postgres) — I will provide the connection 
  string via environment variable
- No AI/LLM features anywhere in the running app
- No third-party auth provider — single default learner, no login flow
- No payment integration — gems/shop are static/mocked only

PROJECT STRUCTURE (create exactly this):
/frontend    -> Next.js app
/backend     -> FastAPI app
/README.md   -> to be filled in later

TASK FOR THIS SESSION:
1. Scaffold the /backend folder:
   - FastAPI app entrypoint (main.py)
   - SQLAlchemy models matching the schema in Duolingo_Clone_PRD.md 
     Section 4 exactly (courses, units, skills, lessons, exercises, 
     exercise_options, users, user_stats, user_skill_progress, 
     user_lesson_attempts, leaderboard_entries, achievements, 
     user_achievements)
   - Alembic setup and an initial migration generating all tables
   - A config module that reads DATABASE_URL from a .env file 
     (create a .env.example with placeholder values)
   - requirements.txt with all needed packages

2. Scaffold the /frontend folder:
   - Next.js + TypeScript + Tailwind CSS initialized
   - Tailwind theme config with the color palette, font, and border-radius 
     values described in extracted_reference.md's Design Tokens section
   - Install Nunito font via next/font
   - A reusable DuoButton component implementing the "pressed 3D shadow" 
     button style described in extracted_reference.md
   - Basic App Router folder structure for the pages listed in the PRD: 
     /, /lesson/[lessonId], /profile, /leaderboard, /settings
   - A .env.local.example with NEXT_PUBLIC_API_URL placeholder

3. Do NOT write business logic, seed data, or full page UIs yet — this 
   session is scaffolding only. Confirm the folder structure and files 
   created when done, and list any decisions you made that I should review.

Write all code yourself, from first principles, based only on the two 
spec documents. Do not import, paste, or adapt code from any external 
Duolingo clone source.