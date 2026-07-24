# Exam Hub — Mock Tests & Exam Preparation

A dedicated educational institute providing carefully designed mock tests and practice examinations based on the latest patterns of major competitive and academic exams. Teachers create virtual classrooms and timed multiple-choice exams; students join classrooms, take auto-submitting timed tests with negative marking, and see instant results.

Built from [`docs/app.md`](docs/app.md).

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions) + TypeScript
- **Tailwind CSS v4** for styling
- **Auth.js (NextAuth v5)** with **Google** sign-in
- **Prisma 6 + PostgreSQL** for data

## Features

### For admins (teachers & staff)
- **Dashboard** — students registered, active exams, pending approvals, recent submissions
- **Classrooms & categories** — create classrooms, group exams into categories
- **Student approval** — approve / reject / revoke requests to join a classroom
- **Exam builder** — MCQ questions, per-question marks & negative marking, timers, publish/hide
- **Performance tracking** — every submission, per-student scores and accuracy

### For students
- **Google sign-up** and request to join classrooms
- **Timed tests** — live countdown, question palette, mark-for-review, **auto-submit** on timeout
- **Instant results** — score, accuracy and full answer review the moment you submit
- **History** — review all past attempts
- **Profile** — update name & phone

### Platform
- Fully responsive, SEO-friendly (`robots.txt`, `sitemap.xml`, metadata), About & Contact pages
- Role-based access enforced server-side; correct answers are never sent to the browser during a test

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

The app uses **PostgreSQL**. Set two connection strings in `.env`:

- `DATABASE_URL` — the pooled connection used at runtime. If you use a PgBouncer-style pooler (e.g. Neon's `-pooler` endpoint), append `?pgbouncer=true` so Prisma disables prepared statements.
- `DIRECT_URL` — a direct (non-pooled) connection used only by Prisma Migrate, which needs session-level advisory locks the pooler doesn't support. On Neon, this is the same host with the `-pooler` segment removed.

The `.env` file already has a generated `AUTH_SECRET`. You also need to add **Google OAuth** credentials:

1. Go to the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client ID** of type *Web application*.
3. Add an authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`
4. Copy the client ID and secret into `.env`:

```env
AUTH_GOOGLE_ID="your-client-id"
AUTH_GOOGLE_SECRET="your-client-secret"
```

5. Set which emails become admins (comma-separated):

```env
ADMIN_EMAILS="you@example.com"
```

> Anyone whose email is listed in `ADMIN_EMAILS` is promoted to **ADMIN** on sign-in; everyone else is a **STUDENT**.

### 3. Set up the database

```bash
npm run db:migrate   # apply the schema (already applied on first setup)
npm run db:seed      # optional: demo classroom + a published sample exam
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google:
- An **admin** email lands in `/admin`.
- A **student** email lands in `/dashboard` → browse classrooms → request to join → take exams once approved.

## Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Create/apply a Prisma migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio to inspect the DB |

## Project structure

```
prisma/
  schema.prisma          # data model (users, classrooms, exams, attempts…)
  seed.ts                # demo data
src/
  auth.ts                # NextAuth config (Google + Prisma adapter, role logic)
  lib/
    prisma.ts            # Prisma client singleton
    auth-helpers.ts      # requireUser / requireAdmin / requireStudent guards
    grading.ts           # NEET/JEE-style scoring (+marks / -negative)
  app/
    (marketing)/         # public landing, about, contact
    login/               # Google sign-in
    (student)/           # dashboard, classrooms, exams, exam runner, results, profile
    admin/               # dashboard, classrooms, students, exams, results
    actions/             # server actions (auth, student, admin)
  components/            # UI: portal shell, buttons, cards, icons…
```

## Going to production

- Set `DATABASE_URL` (pooled) and `DIRECT_URL` (direct, for migrations), `AUTH_SECRET`, Google credentials and `NEXT_PUBLIC_SITE_URL` in your host's env.
- Run `npx prisma migrate deploy` on release to apply migrations.
- Add your production redirect URI in the Google console.
