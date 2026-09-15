# Prowin REOS

Enterprise Real Estate Operating System for Prowin Properties (multi-tenant ready).

## Phase 0

Foundation only: Next.js 15, Prisma schema, Better Auth, RBAC, provider interfaces, design tokens.

See `docs/architecture/` for the approved blueprint and addendum.

## Getting started

```bash
cp .env.example .env.local
# Fill DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL, BETTER_AUTH_URL

npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Default admin after seed:
- `admin@prowinproperties.com` / `ChangeMeNow!123` (change immediately)

## Current phase

**Phase 1 complete** — auth, admin shell, catalog, lead capture + LeadRat plumbing, media foundation.

See `docs/architecture/PHASE-1.md`.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
- Neon PostgreSQL · Prisma 6
- Better Auth · RBAC
- Property providers: Manual + LeadRat (inventory + CRM)
- CRM provider: LeadRat (interface, DB is source of truth)

## Design reference

- `design-reference/prowin-homepage (3).html`
- `design-reference/hero-banner.jpeg` / `public/brand/hero-banner.jpeg`
