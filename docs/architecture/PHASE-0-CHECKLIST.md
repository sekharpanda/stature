# Phase 0 Checklist

## Delivered

- [x] Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- [x] Enterprise folder structure
- [x] Design tokens (Prowin luxury from reference HTML)
- [x] Full Prisma schema (multi-tenant REOS + soft delete + indexes)
- [x] Better Auth scaffolding + `/api/auth/[...all]`
- [x] RBAC permission catalog + `requirePermission`
- [x] Property Provider interface (Manual + Reelly stubs)
- [x] CRM Provider interface (LeadRat stub; DB is SoT)
- [x] Media + AI provider interfaces (reserved)
- [x] Middleware protects `/admin`
- [x] `.env.example`, seed script, architecture docs
- [x] shadcn `components.json` ready
- [x] Production build passes

## Required from you before Phase 1

1. Neon `DATABASE_URL`
2. `BETTER_AUTH_SECRET` (32+ chars)
3. Confirm LeadRat API docs/credentials when available
4. Confirm Reelly API docs/credentials when available
5. Google Maps API key (for discovery map)
6. Explicit **Phase 0 approved** to start Phase 1 (Catalog + Auth UI)

## Do not start yet

- Public property listing UI
- Homepage / landing builders UI
- Reelly sync implementation
- LeadRat HTTP client
- Admin dashboard modules
