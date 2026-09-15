# API Fetch — Architecture & Development Guide

**Status:** Shipped (Admin → Content → API Fetch)  
**Route:** `/admin/api-fetch`  
**Permission:** `cms:blog` (custom sources + blog quick fetch); `property:sync` + `property:read` (LeadRat panel)

---

## 1. Purpose

Admins can **pull any JSON HTTP API on demand** and write results into REOS inventory or CMS content — without code deploys for each new feed.

Three panels on one page:

| Panel | What it does |
|-------|----------------|
| **Custom API sources** | Save reusable endpoints → map fields → Preview → Fetch & integrate |
| **Properties (LeadRat)** | Existing Off Plan inventory sync shortcut |
| **Quick blog fetch** | One-off WordPress / JSON blog pull (env or pasted URL) |

---

## 2. Error audit (recheck results)

Checked on the current codebase:

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass (no TypeScript errors) |
| ESLint on API Fetch / blog sync / providers | Pass |
| Live upsert verify (`npm run test:api-fetch`) | Previously **14/14** targets passed |
| Full HTTP `ApiSource.sync` + `SyncJob` | Previously **SUCCESS** |
| Admin UI create + Fetch & integrate (FAQ fixture) | Passed; FAQ landed in Neon |

### Known limitations (not blockers)

1. **POST without body** — Method can be `POST`, but no request-body editor yet. Use GET feeds, or extend `ApiSource` with optional `bodyJson` later.
2. **Auth secrets in DB** — `ApiSource.authValue` is stored server-side as plain text. Prefer short-lived tokens; rotate if leaked. Never expose via client props (`hasAuth` only).
3. **RBAC for custom sources** — Create/sync currently gates on `cms:blog` even for inventory targets (Property / Developer). Tighten to per-target permissions if needed.
4. **Admin load time** — Dashboard layout still fans out many DB queries; Neon pool can make `/admin/*` slow under load. Pool tuning lives in `src/lib/db/prisma.ts`.
5. **Custom PROPERTY ≠ LeadRat** — Custom API properties are `source = MANUAL`. LeadRat Off Plan remains the dedicated inventory pipeline.
6. **INSIGHT = blog posts** — Market insights page lists published blogs; Insight target writes `BlogPost`, not a separate Insight table.
7. **VERIFY_API_FETCH** — Bypass for scripts only. Never set in production.

---

## 3. Architecture

```
Admin UI (CustomApiSources client)
  → Server Actions (src/actions/api-source.ts)
    → apiSourceService (src/services/api-source.service.ts)
      → fetch(JSON) + field map
      → upsert by ApiSourceTarget
      → Prisma models on Neon
      → SyncJob (type API_IMPORT)

Quick blog path:
  BlogApiSyncControls → runBlogApiSyncAction
    → blogSyncService → providers/blog (wordpress | json)
```

### Data model

```prisma
enum ApiSourceTarget {
  BLOG, INSIGHT, FAQ, TESTIMONIAL,
  DEVELOPER, AREA, COMMUNITY, AGENT, AMENITY,
  PROPERTY, CATEGORY, PAGE, LANDING_PAGE
}

model ApiSource {
  name, target, method, url
  headers Json?          // extra HTTP headers
  authType               // none | bearer | basic
  authValue String?      // server-only secret
  itemsPath String?      // e.g. data.posts
  fieldMap Json          // websiteField → api.path
  autoPublish Boolean
  lastFetchedAt, lastResult
}
```

Idempotency:

- Blog / FAQ / Testimonial: `source` + `externalId` (e.g. `api:{apiSourceId}`)
- Developer / Amenity: `externalId` when mapped, else slug
- Area / Community / Agent / Category / Page / Landing: primarily **slug**
- Property: slug first, then `details.apiExternalId`

---

## 4. File map

| Path | Role |
|------|------|
| `src/app/(dashboard)/admin/api-fetch/page.tsx` | Admin page |
| `src/features/admin/components/api-fetch/custom-api-sources.tsx` | Custom source UI |
| `src/features/admin/components/api-fetch/blog-api-sync-controls.tsx` | Quick blog UI |
| `src/services/api-source.service.ts` | Fetch, map, upsert, jobs |
| `src/actions/api-source.ts` | Server actions + revalidation |
| `src/providers/blog/*` | WordPress + generic JSON blog provider |
| `src/services/blog-sync.service.ts` | Blog-only sync (quick path) |
| `src/actions/blog-sync.ts` | Blog sync actions |
| `prisma/schema.prisma` | `ApiSource`, `ApiSourceTarget`, sync enums |
| `public/fixtures/api-fetch-demo.json` | Local demo payload |
| `scripts/verify-api-fetch.ts` | Multi-target upsert verify |
| `scripts/verify-api-fetch-http.ts` | Full HTTP sync verify |
| `.env.example` | `BLOG_API_*`, LeadRat vars |

Nav: `src/config/admin-nav.ts` → Content → **API Fetch**

---

## 5. How to use (admin)

1. Open **Admin → Content → API Fetch**.
2. **Add API source**.
3. Set **Integrate into** (e.g. Developers, Areas, Properties, Insights).
4. Paste **API URL** (must return JSON).
5. Optional: **Items path** (`faqs`, `data.items`, …).
6. Optional: Auth (Bearer / Basic) + extra headers (`Key=Value` per line).
7. Adjust **Field map** lines: `websiteField=api.path` (supports nested paths like `body.html`).
8. **Save API source** → **Preview** → **Fetch & integrate**.

### Demo fixture (local)

```
http://localhost:3000/fixtures/api-fetch-demo.json
```

Example FAQ source:

- Integrate into: **FAQs**
- Items path: `faqs`
- Field map:
  ```
  externalId=id
  question=question
  answer=answer
  ```

---

## 6. Target field maps (defaults)

| Target | Required fields | Notes |
|--------|-----------------|-------|
| PROPERTY | `name` | Optional prices, `developerName`, `areaName` (area auto-created) |
| DEVELOPER | `name` | Optional website, logoUrl, description |
| AREA | `name` | `cityName` defaults to Dubai |
| COMMUNITY | `name` + `areaName` | Creates area if missing |
| AGENT | `name` | Optional email, phone, bio |
| AMENITY | `name` | Optional icon / iconUrl |
| CATEGORY | `name` | Property categories |
| BLOG / INSIGHT | `title`, `content` | Insight → `/market-insights` via blog list |
| PAGE | `title` | CMS static pages |
| LANDING_PAGE | `title` | Optional campaign |
| FAQ | `question`, `answer` | |
| TESTIMONIAL | `authorName`, `content` | Optional rating |

---

## 7. Environment

### Blog quick fetch (optional)

```env
BLOG_API_ENABLED="false"
BLOG_API_PROVIDER="wordpress"   # wordpress | json
BLOG_API_BASE_URL=""
BLOG_API_KEY=""
BLOG_API_AUTO_PUBLISH="true"
```

You can also paste a URL in the admin UI without env.

### LeadRat properties (existing)

```env
LEADRAT_OFFPLAN_ENABLED="true"
LEADRAT_OFFPLAN_API_KEY="..."
LEADRAT_OFFPLAN_API_BASE_URL="https://projectsapi.leadrat.com/api/public"
```

### Prisma / Neon pool (dev stability)

Configured in `src/lib/db/prisma.ts`:

- `pgbouncer=true`
- `connection_limit` (dev ~5, prod ~8)
- `pool_timeout=30`

Avoid running multiple `next dev` processes against the same Neon pool.

---

## 8. Development notes

### Adding a new target

1. Add value to `enum ApiSourceTarget` in Prisma → `db push` / migrate.
2. Add default field map in `DEFAULT_FIELD_MAPS`.
3. Implement `upsertX` and wire it in `upsertByTarget`.
4. Add option + hints in `custom-api-sources.tsx`.
5. Extend Zod enum via `API_SOURCE_TARGETS` (already shared).
6. Add `revalidatePath` entries in `api-source.ts`.
7. Extend `public/fixtures/api-fetch-demo.json` + verify script.

### Server actions

| Action | Purpose |
|--------|---------|
| `createApiSourceAction` | Persist source |
| `updateApiSourceAction` | Patch source |
| `deleteApiSourceAction` | Soft-delete |
| `previewApiSourceAction` | Fetch + map sample (no write) |
| `syncApiSourceAction` | Full fetch + upsert + SyncJob |

### Verification scripts

```bash
# Multi-target upserts against Neon (cleans up after)
npm run test:api-fetch

# One full HTTP sync via fixture URL (requires next dev on :3000)
npm run test:api-fetch:http
```

Scripts set / require `VERIFY_API_FETCH=1` internally for auth bypass. **Do not enable in production.**

---

## 9. Public site impact

| Target | Where it appears |
|--------|------------------|
| PROPERTY | `/properties`, admin inventory |
| DEVELOPER | `/developers` |
| AREA | `/areas` |
| AGENT | `/our-team` |
| BLOG / INSIGHT | `/blog`, `/market-insights` |
| FAQ | `/contact` (and related) |
| TESTIMONIAL | `/about` |
| PAGE / LANDING_PAGE | CMS / campaign routes |

---

## 10. Related docs

- [LEADRAT-INTEGRATION.md](./LEADRAT-INTEGRATION.md) — Off Plan inventory (not custom API)
- [PROPERTY-DOMAIN.md](./PROPERTY-DOMAIN.md) — Property PMS
- [OVERVIEW.md](./OVERVIEW.md) — System layers
- [CODING-STANDARDS.md](./CODING-STANDARDS.md) — Project conventions

---

## 11. Change log (this feature)

1. Blog API provider + on-demand blog sync.
2. Unified Admin **API Fetch** hub (LeadRat + Blogs).
3. `ApiSource` model — any JSON API with field mapping.
4. Expanded targets: inventory + content (developers → insights → pages).
5. Hardening: auto-create areas for communities/properties; safer property idempotency.
6. Verify scripts + demo fixture for regression testing.
