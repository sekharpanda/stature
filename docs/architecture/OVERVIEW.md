# REOS Architecture — Final (Approved)

> **New to the project?** Start with the master overview:  
> **[../OVERALL-DEVELOPMENT.md](../OVERALL-DEVELOPMENT.md)**

## Product

**Real Estate Operating System** powering Prowin Properties first, multi-tenant ready for future brokerages.

## Locked decisions

| Area | Decision |
|------|----------|
| Discovery | Core product — sticky filters/map, instant search, saved searches, compare, favourites |
| Homepage | Full section builder (CRUD, reorder, duplicate, enable) |
| Landing pages | Unlimited campaign pages + SEO |
| Forms | Dynamic form builder → leads |
| Leads | Neon is SoT → async LeadRat push + retry |
| Properties | LeadRat Project sync + Manual; normalized PMS; public DTOs strip source |
| Tenancy | `Organization` + `organizationId` on domain data |
| AI | Interfaces reserved; no impl yet |
| Auth | Better Auth + RBAC permissions |
| Design | Reference HTML tokens + Dubai hero banner |

## Property domain

See **[PROPERTY-DOMAIN.md](./PROPERTY-DOMAIN.md)** and **[LEADRAT-INTEGRATION.md](./LEADRAT-INTEGRATION.md)**.

Inventory is synced from **LeadRat CRM** (Reelly feeds LeadRat upstream). Direct Reelly HTTP is not used.

## API Fetch (any JSON → site)

See **[API-FETCH.md](./API-FETCH.md)**.

Admin hub at `/admin/api-fetch` pulls arbitrary JSON APIs into inventory (properties, developers, areas, …) and content (blog, insights, FAQs, …), plus LeadRat / WordPress shortcuts.

## Layers

```
UI (Server Components / Client islands)
  → Server Actions / Route Handlers
    → Services (domain + RBAC)
      → Repositories (Prisma)
      → Providers (Property / CRM / Media / AI)
        → Neon | LeadRat | Blog APIs | Custom JSON APIs | Storage
```

## Phase gate (historical)

Early phases gated public UI behind PMS readiness. **Current state:** public site, admin modules, LeadRat sync, CMS, and API Fetch are shipped — see [OVERALL-DEVELOPMENT.md](../OVERALL-DEVELOPMENT.md) for the live maturity snapshot.

- **Phase 0** — foundation (done)
- **Admin shell** — enterprise dashboard chrome (done)
- **Phase 1+** — auth, catalog, properties, marketing site, integrations (done / ongoing polish)
