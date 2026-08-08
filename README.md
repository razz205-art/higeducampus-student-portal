# HiG EDUCAMPUS Student Portal

A full institutional LMS built on Next.js 14 (App Router) — authentication, attendance (with
live-class check-in), student progress tracking, exam countdowns, a notification center,
weekly timetables, results/rankings, certificates with QR verification, study materials, and
a full admin dashboard with cross-module analytics.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · NextAuth (Auth.js v5) ·
PostgreSQL · Prisma · Resend · ApexCharts · framer-motion · ESLint · Prettier

## Modules

| Module | Routes | What it does |
|---|---|---|
| **Authentication** | `/login`, `/register`, `/forgot-password`, `/reset-password` | Credentials + Google OAuth, role-based access, account lockout, password reset |
| **Dashboards** | `/student`, `/faculty`, `/academic-admin`, `/super-admin` | Role-specific home pages inside a shared sidebar/top-nav shell |
| **Attendance** | `/student/attendance`, `/faculty/attendance`, `/academic-admin/attendance`, `/attendance` | Calendar view, trend chart, CSV/Excel/PDF export; faculty live-class sessions (Zoom/Meet); a single permanent public check-in link with enrollment/duplicate verification |
| **Progress Tracker** | `/student/progress` | Lesson completion, quiz performance, learning streak, achievements/badges, weekly/monthly activity |
| **Exam Countdown** | `/student/exams`, `/academic-admin/exams` | Live animated countdowns (days/hours/min/sec), admin-editable dates |
| **Notification Center** | `/notifications` | Search, category + read-status filters, pinned notifications, image/PDF/video attachments, browser notifications |
| **Timetable** | `/student/timetable`, `/faculty/timetable`, `/academic-admin/timetable` | Recurring weekly schedule projected onto real dates — Today/Tomorrow/Week/Calendar views |
| **Results** | `/student/results`, `/academic-admin/results` | Internal results, mock tests, assignments, semester GPA/grades, batch rank |
| **Certificates** | `/student/certificates`, `/academic-admin/certificates`, `/verify/[code]` | On-demand PDF certificate generation with an embedded QR code; public, unauthenticated verification; admin revoke/restore |
| **Study Materials** | `/student/materials`, `/academic-admin/materials` | Documents/videos/links per course |
| **Admin Dashboard** | `/academic-admin` | Institution stats + management grid tying every module together |
| **Analytics** | `/academic-admin/analytics` | Student growth, attendance trend, course/assignment completion, faculty performance, daily/monthly active users (from real login audit data), report export |

## Folder structure

```
lms-portal/
├── prisma/
│   ├── schema.prisma        # 25 models — Users/Courses/Attendance/Progress/Results/
│   │                          Certificates/Materials/Notifications/Timetable/Exams
│   └── seed.ts               # Super Admin + optional demo dataset (SEED_DEMO_ATTENDANCE=true)
├── src/
│   ├── app/
│   │   ├── (auth)/            # public: login, register, forgot/reset password
│   │   ├── (protected)/       # session-gated, wrapped in the dashboard shell
│   │   │   ├── student/       faculty/     academic-admin/   super-admin/
│   │   │   └── notifications/ (shared across all roles)
│   │   ├── attendance/        # public permanent check-in link (auth required, role-agnostic)
│   │   ├── verify/[code]/     # PUBLIC certificate verification — no auth
│   │   └── api/                # NextAuth handler + report/export/summary endpoints
│   ├── components/             # organized per module (attendance/, timetable/, admin/, …)
│   ├── config/                  # site.ts (non-secret config), navigation.tsx (sidebar)
│   ├── lib/
│   │   ├── auth/                 # NextAuth config (edge-safe split from the Node-only part)
│   │   ├── actions/                # Server Actions, one file per module
│   │   ├── data/                    # Prisma queries, one file per module
│   │   ├── security/                 # password hashing, reset tokens, rate limiting
│   │   └── utils/                     # date (UTC-safe), csv, report-export (shared PDF/Excel/CSV)
│   ├── middleware.ts             # edge auth + role-based route protection
│   └── types/                     # one file per module
```

## Architecture notes worth knowing

- **RBAC is one file.** `src/lib/rbac/permissions.ts` maps route prefixes to allowed roles.
  `middleware.ts` and every protected layout both read from it — permissions can't drift out
  of sync between the two enforcement points.
- **Server Actions, not API routes, for mutations.** Every create/update/delete in the app is a
  Server Action (`"use server"`), each independently re-checking the caller's session and role
  server-side — never trusting client-supplied role claims.
- **Report exports are unified.** `lib/utils/report-export.ts` is the single CSV/Excel/PDF
  builder used by Attendance, Results, and Analytics — not three separate implementations.
- **Charts are shared, not duplicated.** `ActivityChart` (ApexCharts) is reused across Progress,
  Timetable, and Analytics; `AttendanceTrendChart` and `CourseProgressCard` were both extended
  with optional props rather than forked when a second module needed a similar shape.
- **Attachments/materials/study files are URL references, not uploads.** No storage provider
  (S3/R2/Cloudinary) is configured in this project. Admin pastes a link to an already-hosted
  file. Real upload handling is a legitimate infrastructure decision left for whoever deploys
  this, not something faked with local disk storage in a serverless-friendly app.
- **Daily/Monthly Active Users are computed from the existing login audit trail**
  (`AuditLog` rows written by the auth module since day one) — no separate analytics/tracking
  system was added.

## Getting started

```bash
npm install
cp .env.example .env        # fill in the values below
npm run prisma:migrate       # creates every table
npm run prisma:seed          # creates a Super Admin account
npm run dev
```

### Environment variables

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` in dev |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud Console OAuth credentials |
| `RESEND_API_KEY` / `EMAIL_FROM` | From resend.com |
| `ALLOWED_STUDENT_EMAIL_DOMAIN` | Optional — restricts self-registration to one domain |
| `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | Used once by the seed script |
| `SEED_DEMO_ATTENDANCE` | Set `true` to seed a full demo dataset (course, faculty, students, attendance history, quizzes, assignments, semester results, a certificate, study materials, notifications, timetable, exam countdowns, login activity). **Never set true against a real database.** |

Run `npm run prisma:seed` with `SEED_DEMO_ATTENDANCE=true` to get a fully populated demo:
6 students, 1 faculty member, CS101 with real attendance/quiz/assignment history, a published
Semester 1 result for 3 students (for a meaningful batch rank), an issued certificate, and
enough login activity for the DAU/MAU charts to show real variation.

### Code quality

```bash
npm run lint          # ESLint (next/core-web-vitals + next/typescript)
npm run format          # Prettier (with prettier-plugin-tailwindcss)
npm run typecheck         # tsc --noEmit
npm run build              # production build
```

## Security posture

- Passwords: bcrypt (12 rounds), server-enforced strength rules regardless of client validation.
- Account lockout after 5 failed logins (15 min), audit-logged.
- Password reset tokens: SHA-256-hashed at rest, single-use, 30-minute expiry.
- CSRF: handled by NextAuth. Security headers (HSTS, X-Frame-Options, etc.) set in
  `next.config.mjs`.
- Every Server Action independently re-verifies the caller's role — the UI hiding a button is
  never the only thing standing between a user and an unauthorized action.
- Rate limiting on: registration, password reset, self-checkin, and every report/PDF export
  endpoint (PDF/Excel generation is CPU-intensive — these are the routes most worth protecting
  against abuse). The limiter is in-memory and **per-instance**; before running more than one
  server instance, swap `lib/security/rate-limit.ts` for a shared store (Upstash Redis is a
  drop-in fit — the function signature is designed for it).
- `robots.txt` and a `robots: noindex` meta tag block all crawling — this is an internal
  institutional portal, and `/verify/[code]` pages show a real person's name; nothing here
  should ever be indexed by a search engine.
- Known dependency findings (`npm audit`): a `postcss` advisory bundled inside `next`'s own
  `node_modules` (build-time only, fixing requires a breaking Next major-version downgrade —
  worse trade), and a `uuid` advisory via `exceljs` (no fixed exceljs release exists yet).
  Both were evaluated and left as-is deliberately, not overlooked.

## Known limitations

- No file upload storage (see "Attachments" above) — everything is URL references.
- The in-memory rate limiter doesn't share state across multiple server instances.
- No admin UI for authoring Quiz/Module/Lesson content — provisioned via `prisma:seed` or
  Prisma Studio, same as Course provisioning was before the Admin Dashboard module added a UI
  for it.
- No `LATE` attendance status (only Present/Absent/Leave).
- Timetable has no per-occurrence exception model — disabling a class disables it for every
  future week, not one date (e.g. can't cancel just one Wednesday).

## Deployment

This app deploys cleanly to **Vercel** (or any Node.js host that supports Next.js 14).

1. **Provision Postgres.** Any managed Postgres works (Neon, Supabase, Railway, RDS). Copy the
   connection string into `DATABASE_URL`.
2. **Set every environment variable** from the table above in your hosting provider's dashboard
   — never commit `.env` to git (already gitignored).
3. **Generate a real `AUTH_SECRET`**: `openssl rand -base64 32`. Don't reuse the one from local
   development.
4. **Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`** to your real production domain (both need
   the final HTTPS URL — the QR codes on certificates and the notification/attendance links are
   built from `NEXT_PUBLIC_APP_URL`).
5. **Google OAuth**: add your production domain's callback URL
   (`https://yourdomain.com/api/auth/callback/google`) to the OAuth client in Google Cloud
   Console before going live.
6. **Run the migration** against the production database once, before first traffic:
   `npx prisma migrate deploy` (not `migrate dev` — that's for local development only).
7. **Seed only the Super Admin**, never the demo dataset, in production:
   `npm run prisma:seed` with `SEED_DEMO_ATTENDANCE` unset or `false`. Log in immediately and
   change the printed password.
8. **Build**: `npm run build` (this runs `prisma generate` first, see `package.json`).
9. **If deploying to more than one server instance**, replace the in-memory rate limiter
   (`lib/security/rate-limit.ts`) with Upstash Redis or similar first — see the code comment
   there for why.
10. **Verify `robots.txt`** is being served at the domain root after deploy — some hosts require
    static files in `public/` to be explicitly included in the build output.

## Optimization pass (latest)

The most recent commit is a full-project audit, not a new module:

- **Performance**: fixed a real N+1 query in the admin analytics course-completion calculation
  (was one DB round-trip per enrolled student per course); parallelized three sequential
  month-loop queries with `Promise.all`.
- **Accessibility**: fixed invalid nested-interactive-element HTML in `NotificationCard` (a
  `<button>` containing `<span role="button">` children with no keyboard support) — restructured
  to a keyboard-accessible wrapper with real `<button>` children.
- **Security**: added rate limiting to 5 API routes that had none (certificate PDF download and
  every report/export endpoint — all CPU-intensive PDF/Excel generation).
- **Code cleanup**: consolidated 5 independently-duplicated weekday-label arrays into two shared
  exported constants in `lib/utils/date.ts`.
- **SEO/privacy**: added `robots.txt` and a `robots: noindex` meta tag — this app should never
  be crawled, and one of its pages shows real people's names.
- **Verified, not just claimed**: ESLint, `tsc --noEmit`, and `next build` all pass clean after
  every change in this pass.
