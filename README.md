# Hiruni & Ravindu wedding invitation

A Next.js wedding invitation with personalized guest links, public RSVP submission, and a password-protected guest ledger backed by PostgreSQL and Prisma.

## Local setup

Requirements: Node.js 22.6 or newer and a PostgreSQL database.

```bash
npm ci
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The guest ledger is at [http://localhost:3000/admin](http://localhost:3000/admin).

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Environment variables

- `DATABASE_URL`: pooled application database connection used at runtime.
- `DIRECT_URL`: direct database connection used by Prisma migrations.
- `ADMIN_PASSWORD`: password for guest and RSVP management.
- `SUPER_ADMIN_PASSWORD`: separate password that can also manage inviting parties.
- `ROOT_DOMAIN`: optional bare production domain, such as `wedding.example.com`.

Keep real credentials in `.env` locally and in the deployment provider's secret store. Do not commit them.

## Commands

```bash
npm run dev        # development server
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # unit tests
npm run build      # Prisma generation and production build
npm start          # serve the production build
```

## Personalized invitation links

Without `ROOT_DOMAIN`, guest links use `/invite/<slug>`. To use links such as `jane-doe-a1b2c3d4e5f6.wedding.example.com`, configure `ROOT_DOMAIN`, wildcard DNS for `*.wedding.example.com`, and the same wildcard domain on the hosting provider.

New links include a random suffix and remain stable when a guest's name changes.

## Deployment

Apply committed migrations before starting a new release:

```bash
npx prisma migrate deploy
```

The CI workflow runs linting, type-checking, tests, and a production build. The scheduled Supabase workflow requires a repository secret named `DIRECT_URL`.
