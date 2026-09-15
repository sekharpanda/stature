# Prowin Properties Website — Overall Development Documentation

**Product:** Real Estate Operating System (REOS)  
**First tenant:** Prowin Properties (`prowinproperties.com`)  
**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Prisma · Neon PostgreSQL · Better Auth  
**Repo:** `Prowin-property-Next js`  
**Last updated:** August 2026

This document is the **master overview** of how the website was built, what ships today, how it is structured, and where detailed architecture docs live.

---

## 1. Vision

Build a **Real Estate Operating System** that:

1. Powers a luxury public website for Prowin Properties (Dubai off-plan / ready inventory).
2. Gives the team a full **admin console** to manage inventory, leads, CMS, SEO, and integrations.
3. Stays **multi-tenant ready** (`Organization` + `organizationId`) for future brokerages.
4. Treats **Neon as source of truth**; CRM (LeadRat) is async — the site never depends on CRM uptime for browsing.

---

## 2. Development timeline (phases)

| Phase | Status | What was delivered |
|-------|--------|--------------------|
| **Phase 0 — Foundation** | Done | App Router scaffold, design tokens, full Prisma schema, Better Auth + RBAC catalog, provider interfaces, env template |
| **Admin shell** | Done | Sidebar, topbar, ⌘K search, KPIs, charts, notifications, dark mode, placeholder module routes |
| **Phase 1 — Platform** | Done | Login, catalog (country→city→area→community→developer), lead capture API, LeadRat CRM push + cron retry, seed data |
| **Property PMS** | Done | LeadRat Off Plan sync, manual properties, admin property CRUD/import, public listings + detail + map |
| **Public marketing site** | Done | Homepage builder-driven home, about, contact, team, developers, areas, blog, insights, legal pages |
| **CMS & growth** | Done | Homepage builder, landing/campaign pages, forms builder, FAQs, testimonials, SEO manager, TipTap blog |
| **Analytics & maturity** | Done | Client analytics events, admin analytics/reports, Playwright smoke tests, Neon pool hardening |
| **API Fetch hub** | Done | On-demand LeadRat + WordPress/JSON blog + custom JSON → any inventory/content target |

Detailed phase notes: [PHASE-0.md](./architecture/PHASE-0.md), [PHASE-1.md](./architecture/PHASE-1.md), [ADMIN-SHELL.md](./architecture/ADMIN-SHELL.md).

---

## 3. System architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Public site (marketing + discovery)                         │
│  /  /properties  /blog  /areas  /developers  /contact  …    │
└──────────────────────────┬──────────────────────────────────┘
                           │ RSC + Server Actions / Route Handlers
┌──────────────────────────▼──────────────────────────────────┐
│  Admin REOS (/admin/*) — Better Auth + RBAC                  │
│  Inventory · Leads · Content · Integrations · Users          │
└──────────────────────────┬──────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
 Services            Repositories            Providers
 (domain + RBAC)     (Prisma)                (adapters)
     │                     │                     │
     └──────────┬──────────┴──────────┬──────────┘
                ▼                     ▼
         Neon PostgreSQL      LeadRat · Google Places ·
                              Blog/Custom JSON APIs · Email
```

Canonical architecture: [OVERVIEW.md](./architecture/OVERVIEW.md).

### Layer rules

| Layer | Responsibility |
|-------|----------------|
| `src/app` | Routes only — pages, layouts, API routes |
| `src/features` | UI modules (marketing, admin, leads) |
| `src/actions` | `"use server"` mutations / admin actions |
| `src/services` | Business logic + permission checks |
| `src/repositories` | Prisma queries |
| `src/providers` | External systems (LeadRat, blog, CRM, media, AI stubs) |
| `src/config` | Brand, nav, homepage defaults |
| `prisma` | Schema + seed |

Coding conventions: [CODING-STANDARDS.md](./architecture/CODING-STANDARDS.md).

---

## 4. Public website (what visitors see)

| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero search, featured projects, trust strip (live Google rating), sections from Homepage Builder |
| `/properties` | Off-plan / ready listings — filters, pagination, WhatsApp / enquire CTAs |
| `/properties/[slug]` | Property detail — gallery, units, enquire modal |
| `/properties/map` | Map discovery (Leaflet) |
| `/developers` | Developer directory |
| `/areas` | Area SEO hubs |
| `/our-team` | Agents / consultants |
| `/blog`, `/blogs` | Journal / articles |
| `/blog/[slug]` | Article detail |
| `/market-insights`, `/insights` | Insights desk (page content + recent posts) |
| `/about`, `/about-us` | About + testimonials |
| `/contact` | Contact + FAQs + lead forms |
| `/campaigns/[slug]` | Paid landing pages + thank-you |
| `/reviews` | Google Business reviews surface |
| `/privacy`, `/terms` | Legal |

### Brand & UX

- Brand red `#A01919`, champagne gold accents — `src/config/brand.ts`
- Display / body web fonts (Fraunces · Plus Jakarta Sans substitutes)
- Shared chrome: `PublicSiteShell`, header, footer, lead capture modal
- Analytics tracker posts page views / events to `/api/analytics`

---

## 5. Admin REOS (what the team uses)

Base: `/admin` (requires login). Shell: sidebar + topbar + notifications.

### Inventory

- Property Management (list, detail, new, LeadRat import)
- Developers, Agents, Communities, Areas
- Categories, Amenities, Media Library

### Revenue

- Leads inbox + workflow + CRM sync console
- Reports & Analytics

### Content

- Homepage Builder
- Pages & Landing Pages
- Forms builder (+ field editor, submissions)
- Blog (TipTap)
- **API Fetch** — any JSON API → site content/inventory
- JSON Import, Testimonials, FAQs, SEO Manager

### Administration

- Users, Roles & Permissions
- Notifications, Activity Logs, Settings

Nav config: `src/config/admin-nav.ts`.

---

## 6. Core domains

### 6.1 Properties

- **Sources:** `LEADRAT` (Off Plan public API) and `MANUAL` (admin / custom API Fetch).
- Sync service: `property-sync.service.ts` + LeadRat Off Plan provider.
- Public DTOs strip internal CRM IDs where appropriate.
- Docs: [PROPERTY-DOMAIN.md](./architecture/PROPERTY-DOMAIN.md), [LEADRAT-INTEGRATION.md](./architecture/LEADRAT-INTEGRATION.md).

### 6.2 Leads & CRM

- Neon stores all leads (SoT).
- Async push to LeadRat Enterprise API with retry + `SyncJob` / CRM logs.
- Cron: `/api/cron/crm-sync` (when enabled on hosting plan).
- Site lead forms → `lead.service` → notifications + activity.

### 6.3 CMS

- Homepage sections (JSON configs, reorder via dnd-kit).
- Blog posts (TipTap HTML, cover comment convention `<!--cover:url-->`).
- Landing / campaign pages with UTM defaults.
- Dynamic forms → submissions → leads.
- FAQs & testimonials on public contact/about.

### 6.4 Integrations (API Fetch)

Admin hub `/admin/api-fetch`:

1. Custom JSON sources with field mapping → Property, Developer, Area, Blog, FAQ, …
2. LeadRat Off Plan sync shortcut
3. Quick WordPress / JSON blog pull

Docs: [API-FETCH.md](./architecture/API-FETCH.md).

### 6.5 Trust & reviews

- Google Places Details (server) for live rating / review count on homepage trust strip.
- Env: `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`.

### 6.6 Email

- Google Workspace SMTP (preferred) or Resend fallback.
- Used for transactional / lead notification paths as configured.

---

## 7. Auth & security

| Concern | Implementation |
|---------|----------------|
| Auth | Better Auth (email/password), session cookies |
| Access control | RBAC permission keys (`property:sync`, `cms:blog`, `lead:read`, …) |
| Secrets | Server-only env — never `NEXT_PUBLIC_` for API keys |
| Soft delete | `deletedAt` on tenant models |
| Multi-tenant | All domain rows scoped by `organizationId` |

Default seed admin (override via env): see [PHASE-1.md](./architecture/PHASE-1.md).

---

## 8. Data & hosting

| Piece | Choice |
|-------|--------|
| Database | Neon PostgreSQL (pooled URL + Prisma `pgbouncer` params) |
| ORM | Prisma 6 |
| Hosting | Vercel (production) |
| Local | `npm run dev` → Turbopack on `:3000` |
| Images | Remote Off Plan/S3 URLs; Next Image with unoptimized where needed for third-party hosts |

Prisma pool hardening: `src/lib/db/prisma.ts` (connection limit, timeouts).

---

## 9. Folder map (practical)

```
src/
  app/                 # Public + admin + auth + API routes
  features/
    marketing/         # Public UI
    admin/             # Dashboard UI
    leads/             # Capture forms / modals
  actions/             # Server actions
  services/            # Domain services
  repositories/        # Prisma access
  providers/           # LeadRat, blog, CRM, media, AI stubs
  config/              # Brand, admin nav, homepage defaults
  lib/                 # Auth, db, errors, seo, utils
prisma/
  schema.prisma
  seed.ts
docs/
  OVERALL-DEVELOPMENT.md   ← this file
  architecture/            ← deep dives
public/
  brand/                   # Logo assets
  fixtures/                # API Fetch demo JSON
scripts/                   # Backfills, verify, env sync
e2e/                       # Playwright smoke
```

---

## 10. Local development

```bash
cp .env.example .env.local
# Fill DATABASE_URL, BETTER_AUTH_*, LEADRAT_*, GOOGLE_* as needed

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Useful scripts:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local Turbopack server |
| `npm run build` / `start` | Production build |
| `npm run db:seed` | Org + admin + Dubai seed |
| `npm run test:e2e` | Playwright smoke |
| `npm run test:api-fetch` | API Fetch upsert regression |
| `npm run test:api-fetch:http` | API Fetch full HTTP sync (needs `:3000`) |

---

## 11. Production checklist (high level)

1. Neon `DATABASE_URL` (pooler) on Vercel.
2. `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` = production URL.
3. LeadRat Off Plan key enabled for inventory; Enterprise keys if CRM push needed.
4. Google Places key + Place ID for live reviews.
5. SMTP / Resend for email.
6. Seed or migrate org + admin user once.
7. Deploy (`vercel --prod` / Git push to connected branch).
8. Smoke: `/`, `/properties`, `/admin/login`, one property detail, lead form.

---

## 12. Testing & quality

| Layer | Approach |
|-------|----------|
| Types | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| E2E smoke | Playwright (`e2e/smoke.spec.ts`) |
| Integration | API Fetch verify scripts against Neon |
| Manual | Admin create → public page render |

---

## 13. Current maturity snapshot

**Strong / shipped**

- Public marketing site + property discovery
- Admin shell and most inventory/CMS modules
- LeadRat Off Plan sync + CRM lead push
- Homepage builder, blog, forms, API Fetch
- Google trust strip, analytics events

**Improve next (suggested)**

- Tighten RBAC per API Fetch target
- POST body support on custom API sources
- Encrypt `ApiSource.authValue` at rest
- Further reduce admin dashboard DB fan-out (Neon pool)
- Broader Playwright coverage beyond smoke
- Media library storage backend (Blob/S3) end-to-end

---

## 14. Documentation index

| Doc | Topic |
|-----|-------|
| **[OVERALL-DEVELOPMENT.md](./OVERALL-DEVELOPMENT.md)** | This master overview |
| [architecture/OVERVIEW.md](./architecture/OVERVIEW.md) | Locked product decisions & layers |
| [architecture/PHASE-0.md](./architecture/PHASE-0.md) | Foundation phase |
| [architecture/PHASE-0-CHECKLIST.md](./architecture/PHASE-0-CHECKLIST.md) | Phase 0 checklist |
| [architecture/PHASE-1.md](./architecture/PHASE-1.md) | Auth, catalog, leads |
| [architecture/ADMIN-SHELL.md](./architecture/ADMIN-SHELL.md) | Dashboard chrome |
| [architecture/PROPERTY-DOMAIN.md](./architecture/PROPERTY-DOMAIN.md) | Property PMS |
| [architecture/LEADRAT-INTEGRATION.md](./architecture/LEADRAT-INTEGRATION.md) | CRM / Off Plan APIs |
| [architecture/API-FETCH.md](./architecture/API-FETCH.md) | Any-API integrations hub |
| [architecture/CODING-STANDARDS.md](./architecture/CODING-STANDARDS.md) | Code conventions |
| [architecture/ADDENDUM.md](./architecture/ADDENDUM.md) | Architecture addenda |

---

## 15. Ownership summary

| Area | Primary code |
|------|----------------|
| Public pages | `src/app/*`, `src/features/marketing/*` |
| Admin UI | `src/app/(dashboard)/admin/*`, `src/features/admin/*` |
| Properties | `property*.service/repository`, `providers/leadrat`, `providers/property` |
| Leads | `lead.service`, `providers/crm`, `features/leads` |
| CMS / homepage | `homepage` actions/services, TipTap blog forms |
| API Fetch | `api-source.service`, `providers/blog`, admin `api-fetch` |
| Auth / RBAC | `src/lib/auth`, `constants/permissions` |
| Brand | `src/config/brand.ts`, `public/brand/*` |

---

*This document should be updated when a major module ships or an architecture decision changes. Prefer linking deep dives under `docs/architecture/` rather than duplicating them here.*
