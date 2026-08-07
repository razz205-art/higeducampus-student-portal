# LMS Portal

Enterprise Learning Management System — project initialization.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · NextAuth (Auth.js v5) ·
PostgreSQL · Prisma · Resend · ESLint · Prettier

This phase wires up authentication, database, environment configuration, reusable layouts,
protected routing, and role-based access control. **No dashboard page content has been built
yet** — that's the next phase, built on top of this foundation.

## Folder structure

```
lms-portal/
├── prisma/
│   ├── schema.prisma          # User, Account, Session, PasswordResetToken, AuditLog
│   └── seed.ts                 # bootstraps one Super Admin account
├── src/
│   ├── app/
│   │   ├── (auth)/             # public auth routes — no session required
│   │   │   ├── login/
│   │   │   ├── register/       # student self-signup only
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (protected)/        # role-gated routes — session + role required
│   │   │   ├── layout.tsx      # session guard + shared header (defense in depth)
│   │   │   ├── student/        # placeholder — dashboard page not built yet
│   │   │   ├── faculty/        # placeholder — dashboard page not built yet
│   │   │   ├── academic-admin/ # placeholder — dashboard page not built yet
│   │   │   └── super-admin/    # placeholder — dashboard page not built yet
│   │   ├── api/auth/           # NextAuth handler + register/forgot/reset endpoints
│   │   ├── unauthorized/       # shown when a role hits a route it can't access
│   │   ├── layout.tsx          # root layout (fonts, SessionProvider)
│   │   └── page.tsx            # redirects to /login or the user's role home
│   ├── components/
│   │   ├── ui/                 # Button, Input, Alert — generic primitives
│   │   ├── auth/                # AuthCard, LoginForm, RegisterForm, forms, GoogleButton
│   │   └── layout/              # Header, RoleBadge, SignOutButton (shared shell)
│   ├── config/
│   │   └── site.ts              # site metadata, session timing, route constants
│   ├── lib/
│   │   ├── auth/                 # auth.config.ts (edge-safe), auth.ts (full config)
│   │   ├── db/                   # Prisma client singleton
│   │   ├── email/                 # Resend transactional email templates
│   │   ├── rbac/                  # role → route permission matrix
│   │   ├── security/              # password hashing, reset tokens, rate limiting
│   │   └── validations/           # Zod schemas shared by forms and API routes
│   ├── middleware.ts             # edge-level auth + RBAC route protection
│   └── types/
│       └── next-auth.d.ts        # session/JWT type augmentation
├── .env.example
├── .eslintrc.json
├── .prettierrc.json
└── tailwind.config.ts
```

**Why the `lib/` split?** `lib/auth/auth.config.ts` is edge-safe (no Prisma or bcrypt) and is
imported by `middleware.ts`, which runs on the Edge runtime. `lib/auth/auth.ts` extends it with
the actual providers and database calls, and is only imported by Node-runtime code (API routes,
server components). Keeping this boundary explicit avoids a whole class of "works locally,
breaks in middleware" bugs.

## Getting started

```bash
npm install
cp .env.example .env        # fill in the values below
npm run prisma:migrate       # creates tables
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

The seed script prints the generated Super Admin credentials to the console. **Log in and
change that password immediately** — never leave seed credentials in a real database.

### Code quality

```bash
npm run lint          # ESLint
npm run lint:fix       # ESLint with autofix
npm run format          # Prettier write
npm run format:check     # Prettier check (CI)
npm run typecheck         # tsc --noEmit
```

ESLint extends `next/core-web-vitals` and defers formatting to Prettier via
`eslint-config-prettier` + `eslint-plugin-prettier`, so there's a single source of truth for
style. `prettier-plugin-tailwindcss` keeps class lists sorted automatically.

## Authentication & access control

- **Credentials + Google** via NextAuth v5, JWT sessions (8h, refreshed hourly).
- **Roles**: `STUDENT`, `FACULTY`, `ACADEMIC_ADMIN`, `SUPER_ADMIN` (Prisma enum).
- **Self-registration** (`/register`, `POST /api/auth/register`) is hard-restricted to
  `STUDENT`. Faculty/Admin accounts must be provisioned directly — never through a public
  endpoint. (An admin "manage users" screen is a natural next feature.)
- **Route protection** is defined once, in `src/lib/rbac/permissions.ts`, and read by both
  `middleware.ts` (edge redirect) and `(protected)/layout.tsx` (server-side re-check).
- **Password security**: bcrypt (12 rounds), server-enforced strength rules, account lockout
  after 5 failed attempts (15 min), SHA-256-hashed single-use password reset tokens (30 min
  expiry), audit logging of all security-relevant events.

## Known limitations / next steps

- No dashboard page content yet — `(protected)/{student,faculty,academic-admin,super-admin}`
  are empty placeholders ready for the next phase.
- No admin UI for managing users/roles yet.
- `lib/security/rate-limit.ts` is in-memory and per-instance; swap for Upstash Redis before
  running more than one server instance.
- Email verification (`emailVerified` field exists on `User`) isn't enforced on signup yet.
- Two-factor authentication is not implemented.
