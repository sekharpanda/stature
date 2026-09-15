# Phase 0 — Foundation (Approved Architecture)

Status: **Complete — awaiting Phase 0 sign-off**  
Product: **Real Estate Operating System (REOS)**  
First tenant: **Prowin Properties**

## Architecture deltas locked (post-approval)

1. **Property Discovery Core** — Search-first listing (sticky filters/map, instant filters, autocomplete, saved searches, compare, favourites, recently viewed, cursor pagination).
2. **Homepage Builder** — Section CRUD, reorder, duplicate, enable/disable, typed configs (JSON).
3. **Landing Page Builder** — Unlimited campaign/SEO landing pages with dynamic meta + sections.
4. **Dynamic Form Builder** — Configurable forms → submissions → leads pipeline.
5. **Advanced Analytics** — Lead, property, campaign, and traffic metrics (events + aggregates).
6. **Advanced Media Library** — Folders, tags, preview, versions, bulk upload, storage adapter ready.
7. **Workflow & Approval** — Draft → Review → Approved → Published for CMS content.
8. **Notification Center** — In-app (+ future email) for leads, sync, publish, system alerts.
9. **Rich Area & Developer pages** — SEO hubs with POIs, ROI, FAQs, related content.
10. **AI Ready** — Reserved `src/modules/ai` + interfaces; no implementation in Phase 0.
11. **Multi-Tenant Ready** — `Organization` + `organizationId` on all tenant data.
12. **Property Source Strategy** — Provider layer (Reelly / Manual / future); public DTOs strip source.
13. **UX upgrade** — Luxury design system from reference HTML + hero banner; Lighthouse ≥ 95 target.
14. **LeadRat CRM** — Neon DB is SoT; async push + retry; site never depends on LeadRat uptime.

## Phase 0 scope (this deliverable)

- Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS 4
- Enterprise folder structure
- Design system tokens (Prowin luxury)
- Full Prisma schema (normalized, soft-delete, indexes, multi-tenant)
- Better Auth scaffolding
- RBAC permission catalog
- Property Provider + CRM Provider interfaces
- Env template, coding standards stubs
- **No** public pages, listing UI, or business modules yet

## Out of scope until Phase 1+

Frontend pages, Reelly sync implementation, LeadRat HTTP client, admin UI modules, homepage/landing builders UI.
