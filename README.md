# Family Productivity

A gamified productivity web app for families. Manage house tasks, sports, school work, and track scores with streaks and leaderboards.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Supabase** (Auth, PostgreSQL, Realtime)
- **shadcn/ui**-style components
- **Recharts** (score charts)
- **Framer Motion** (animations)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **SQL Editor**, run the migrations in order:
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rls_policies.sql`
   - `supabase/migrations/00003_realtime.sql`
   - `supabase/migrations/00004_onboarding_rls.sql`

### 3. Configure Auth

In Supabase **Authentication** → **Providers**:
- Enable **Email** provider
- Enable **Confirm email** off (for magic link flow)

### 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For the seed script (optional):

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 6. Seed demo data (optional)

```bash
npm run db:seed
```

Creates a demo family with tasks, sport activities, and school tasks. Link your auth user to a member via Supabase dashboard or onboarding.

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Supabase

Database and auth are hosted on Supabase. Run migrations via Supabase CLI or SQL Editor.

## Pages

- **/** – Family dashboard (leaderboard, streaks, weekly chart)
- **/today** – Kid view: my tasks, sport, school, complete buttons
- **/admin** – Create members, tasks, sport activities, school tasks (admin only)
- **/auth/login** – Magic link sign-in
- **/onboarding** – Create family (first-time users)

## Features

- Magic link authentication
- House tasks (take, complete, score)
- Sport activities (weekly recurring, extra)
- School tasks (homework, exam, project)
- Scores log (immutable)
- Streaks (consecutive days)
- 7-day streak bonus (+10 pts)
- Realtime leaderboard updates
- Confetti on task completion
