# CampusHub — UET Student Companion

Your university life, organized. CampusHub brings courses, assignments, deadlines,
timetable, study materials, GPA, progress analytics and an AI study assistant into a
single student dashboard.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + React Router + Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Security:** row level security on every table, storage paths scoped per user, AI
  provider keys kept server-side in an Edge Function

## Features

| Area | What you get |
| --- | --- |
| Auth | Email/password register, login, logout, forgot/reset password, persisted sessions |
| Dashboard | Greeting, today's classes, upcoming deadlines, tasks due today, GPA and study-hour stats |
| Courses | CRUD, search, semester filter, per-course detail with assignments, materials, classes, grades and sessions |
| Assignments | CRUD, complete/uncomplete, priority, status, overdue detection, search, filter, sort |
| Tasks | CRUD with categories, priorities and All/Today/Upcoming/Completed/Overdue filters |
| Timetable | Weekly grid (Sun–Sat), add/edit/delete classes, room and time validation, today highlighting |
| Materials | Upload PDFs/Office files/images to private Supabase Storage, search, filter, signed downloads, delete |
| GPA | A+–F scale with editable grade points, semester and cumulative GPA, saved results |
| Progress | GPA trend, assignment completion by course, study hours, task mix, study-session logging |
| AI | Tutor chat, study-plan generator, MCQ quiz with scoring and explanations, notes summarizer |
| Platform | Global search (Ctrl/Cmd+K), notifications, profile with avatar upload, theme + settings |

## Quick start

```bash
nvm use 20            # Node 20+
npm install
cp .env.example .env  # then fill in the Supabase values below
npm run dev
```

### Local Supabase (recommended for development)

Requires Docker.

```bash
npx supabase start      # applies migrations in supabase/migrations and seeds demo data
npx supabase status     # prints API_URL and ANON_KEY for your .env
```

Put those two values into `.env`:

```ini
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<ANON_KEY from supabase status>
```

Demo account created by `supabase/seed.sql`: **demo@campushub.test / campushub-2026**
(local only — never seed a hosted project).

Useful commands:

```bash
npx supabase db reset   # re-apply all migrations + seed
npx supabase stop       # shut the stack down
```

### Hosted Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Link and push the schema:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
3. Copy the project URL and anon key into `.env` (or your hosting provider's env vars).
4. Deploy the AI function and set its secrets (see below).

## AI setup

All AI traffic goes through the `ai` Edge Function so provider keys never reach the
browser. It supports OpenAI-compatible providers (OpenAI, Groq, OpenRouter, Together,
Ollama gateways) and Gemini.

```bash
npx supabase secrets set AI_PROVIDER=openai AI_API_KEY=sk-... AI_MODEL=gpt-4o-mini
npx supabase functions deploy ai
```

| Secret | Purpose |
| --- | --- |
| `AI_PROVIDER` | `openai`, `groq`, `openrouter`, `together`, `ollama` or `gemini` |
| `AI_API_KEY` | Provider API key (server-side only) |
| `AI_MODEL` | Model name, e.g. `gpt-4o-mini` |
| `AI_BASE_URL` | Optional override for self-hosted/compatible gateways |

The function requires an authenticated Supabase JWT and rate-limits each user to 20
requests per minute. Without secrets configured, AI pages surface a friendly error and
the rest of the app keeps working.

## Scripts

```bash
npm run dev           # Vite dev server
npm run build         # typecheck + production build
npm run preview       # preview the production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier write
npm test              # Vitest
```

### Tests

Unit tests cover GPA calculation, validation, task filters and overdue logic. The
integration suite in `src/test/integration` runs against a live Supabase stack and
verifies registration, login/logout, course CRUD, assignment create/complete/delete and
that row level security isolates one student's data from another. It is skipped unless
credentials are supplied:

```bash
SUPABASE_TEST_URL=http://127.0.0.1:54321 \
SUPABASE_TEST_ANON_KEY=<anon key> \
npm test
```

## Project structure

```
src/
  components/   UI primitives (Button, Modal, Card, States…) and app shell (Sidebar, Topbar…)
  contexts/     Auth, theme and toast providers
  features/     Feature-specific components (course/assignment/task forms and rows)
  hooks/        useAuth, useTheme, useToast, useAsyncData, useDebouncedValue
  layouts/      App and auth layouts
  lib/          Supabase client, error mapping, formatting, GPA maths, validation
  pages/        One component per route
  routes/       Protected and public-only route guards
  services/     Typed Supabase data access per table + AI client
  types/        Generated database types and domain models
supabase/
  migrations/   Schema, RLS policies, storage buckets, notification sync
  functions/ai/ Edge Function that talks to the AI provider
  seed.sql      Demo data for local development
```

## Security notes

- Every user-owned table has RLS enabled with `auth.uid()`-based policies; course-linked
  rows additionally verify that the referenced course belongs to the caller.
- Study materials live in a private bucket under `<user_id>/…`; downloads use signed URLs.
- Only the anon key ever reaches the browser. Service-role keys and AI provider keys stay
  in Supabase secrets.
- `.env` is git-ignored — commit `.env.example` only.
