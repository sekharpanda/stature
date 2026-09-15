# Property Domain Architecture (PMS)

**Status:** Locked for implementation  
**Inventory source:** LeadRat CRM Project API (https://apidoc.leadrat.info/) — Reelly feeds LeadRat; REOS does **not** call Reelly directly  
**Sources:** `LEADRAT` | `MANUAL`  
**Companion doc:** [LEADRAT-INTEGRATION.md](./LEADRAT-INTEGRATION.md)  
**Principle:** Mirror the LeadRat Project payload in a normalized Neon schema. Do not flatten rich nested structures into JSON unless the field is truly opaque or unstable.

---

## 1. Goals

Build an enterprise Property Management System that:

1. Imports and syncs LeadRat **projects** (Reelly-fed upstream) as first-class **Properties**
2. Supports fully manual property creation with the same domain model
3. Never exposes LeadRat credentials or raw API calls to the frontend
4. Keeps Neon PostgreSQL as the system of truth for inventory, leads, and analytics
5. Allows future providers without changing admin or public UI contracts

---

## 2. Terminology mapping

| LeadRat (API) | REOS (PMS) | Notes |
|---|---|---|
| Project | Property | Admin UX uses “Property”; DB table `properties` |
| `id` (GUID) | `leadratProjectId` | Primary external key for sync |
| Optional Reelly id | `reellyProjectId` | Nullable if LeadRat exposes upstream id later |
| Builder / `builderDetails` | `Developer` | Upsert by name / external id |
| `address.*` | `PropertyAddress` + Area/Community | Full hierarchy preserved |
| `amenities[]` | `PropertyAmenity` → `Amenity` | Many-to-many, never JSON arrays |
| Blocks / unitinfo | `PropertyBuilding` / `PropertyUnitType` | Normalized child rows |
| `associatedBanks` | `Bank` + `PropertyBank` | Many-to-many |
| `imageUrls` | `PropertyImage.galleryKind` | Separate image rows |
| `brochures` / `documents` / `videos` | Dedicated media tables | Never merge into one blob |

Public DTOs **never** expose `source`, provider IDs, sync errors, or raw payloads.

See **[LEADRAT-INTEGRATION.md](./LEADRAT-INTEGRATION.md)** for auth, endpoints, and field map.

---

## 3. Provider architecture

```
Admin UI / Public UI
        │
        ▼
Property Service          (RBAC, validation, orchestration)
        │
        ├── Property Repository       (Prisma / Neon)
        ├── Catalog Repository        (developers, areas, amenities, banks)
        ├── Sync Repository           (PropertySync + logs)
        ├── Analytics Repository
        │
        ▼
Property Provider Interface
        ├── LeadRatPropertyProvider   (HTTP via shared LeadRat client)
        └── ManualPropertyProvider    (wizard → same canonical write path)
```

### Rules

- Frontend talks only to **Property Service** (Server Actions / Route Handlers).
- `LEADRAT_API_KEY` / `LEADRAT_SECRET_KEY` / `LEADRAT_TENANT` live in env — never in browser bundles.
- Inventory is **read** from LeadRat Projects; leads are **written** to LeadRat separately.
- Sync jobs run server-side (cron + manual “Force Refresh”).

### Provider contract (expanded)

```ts
interface PropertyProvider {
  name: "leadrat" | "manual" | string;
  listProjects(ctx, cursor?): Promise<ProviderListPage>;
  getProject(ctx, externalId): Promise<CanonicalProperty | null>;
  detectChanges?(ctx, localHash, remote): Promise<boolean>;
  sync(ctx, options?): Promise<PropertySyncResult>;
}
```

`CanonicalProperty` mirrors the LeadRat project detail payload closely, then the repository persists into normalized tables.

---

## 4. Source & sync metadata

Every property stores origin identity on the core row **and** detailed sync state in `PropertySync`.

| Field | Location | Purpose |
|---|---|---|
| Internal UUID | `Property.id` | Primary key |
| Source | `Property.source` | `LEADRAT` \| `MANUAL` |
| LeadRat Project ID | `Property.leadratProjectId` | Nullable for MANUAL |
| Sync Status | `PropertySync.status` | `IDLE` \| `PENDING` \| `SYNCING` \| `SYNCED` \| `FAILED` \| `STALE` \| `PROVIDER_DELETED` |
| Last Sync Date | `PropertySync.lastSyncedAt` | |
| Imported Date | `PropertySync.importedAt` | First successful import |
| Sync Version | `PropertySync.syncVersion` | Monotonic / content hash version |
| Content Hash | `PropertySync.contentHash` | Change detection |
| API Version | `PropertySync.apiVersion` | e.g. `v2` |
| Last Sync Error | `PropertySync.lastError` | |
| Raw snapshot | `PropertySync.lastPayload` | Optional JSON for debug / re-map |

`PropertySyncLog` stores every attempt (request meta, response meta, error, duration).

Deleted-on-provider detection: if Reelly no longer returns a project, set `PROVIDER_DELETED` and optionally unpublish — never hard-delete inventory without admin action.

---

## 5. Normalized database design

### 5.1 Core — `Property`

Stores only identity, commercial summary, publish workflow, and FK pointers:

- `name`, `slug`, `source`, `reellyProjectId`, `reellySlug`
- `status` (DRAFT / PUBLISHED / ARCHIVED / EXPIRED)
- `saleStatus`, `constructionStatus` (Reelly commercial / lifecycle labels)
- `developerId`, `communityId`, `areaId`, `cityId`, `countryId`, `categoryId`, `propertyTypeId`
- `minPrice`, `maxPrice`, `currency`
- `minSize`, `maxSize`, `areaUnit`
- `description` (`overview`), `shortDescription`
- `possessionDate` / `completionLabel` (e.g. `Q4 2026`)
- `furnishing`, `hasEscrow`, `escrowNumber`, `postHandover`
- `serviceCharge`, `depositDescription`, `brand`, `managingCompany`
- `readinessProgress`, `website`
- `isFeatured`, `isVerified`, `isPartnerProject`, `publishedAt`
- timestamps + soft delete

**Not** on `Property`: galleries, amenities list, banks list, SEO blob, sync logs, analytics counters (those are related tables).

### 5.2 Address — `PropertyAddress` (1:1)

Do not simplify. Store:

| Field |
|---|
| country, state, city, district |
| locality, subLocality |
| community, subCommunity |
| tower |
| latitude, longitude |
| googlePlaceId |
| mapLocation (formatted / embed URL) |
| polygon (Json, from Reelly `location.polygon`) |
| sector, village (Reelly extras — kept, not dropped) |

Geographic catalog (`Country` → `City` → `Area` → `Community`) remains for filters and SEO landing pages. Address is the **property-level** precision layer.

### 5.3 Media (separate modules — never one catch-all property media table)

| Table | Role |
|---|---|
| `PropertyImage` | Cover + gallery; `galleryKind`: COVER, LOBBY, INTERIOR, ARCHITECTURE, GENERAL_PLAN, UNIT_LAYOUT, OTHER |
| `PropertyVideo` | Video reviews / tours |
| `PropertyBrochure` | Marketing brochures |
| `PropertyDocument` | Floor plan PDFs, contracts, other docs |
| `PropertyFloorPlan` | Named floor-plan documents + optional layout images |

Shared fields: `url`, `caption`, `alt`, `sortOrder`, mime/size/width/height metadata, optional `mediaAssetId` (links to Media Library for manual uploads), `externalId`.

The org-wide **Media Library** (`MediaAsset`) stays for CMS / uploads. Property media rows may reference it **or** store provider URLs directly (Reelly CDN).

### 5.4 Amenities — M2M

```
Amenity  ←→  PropertyAmenity  ←→  Property
```

Persist Reelly amenity `id` on `Amenity.externalId`. Optional per-link icon override on `PropertyAmenity`.

### 5.5 Banks — M2M

```
Bank  ←→  PropertyBank  ←→  Property
```

Reelly does not ship a stable banks array today; escrow lives on project/buildings. Banks remain a first-class catalog for:

- Manual property financing partners
- Future provider fields
- Marketing “approved banks” UI

### 5.6 SEO — `PropertySeo` (1:1)

Meta title/description, OG/Twitter, canonical, schema.org JSON-LD.

### 5.7 Sync — `PropertySync` (1:1) + `PropertySyncLog`

See §4.

### 5.8 Reelly nested entities (normalized)

| Table | Source path |
|---|---|
| `PropertyBuilding` | `buildings[]` |
| `PropertyUnitType` | `typical_units[]` / unit blocks |
| `PropertyUnitLayout` | `typical_units[].layout[]` |
| `PaymentPlan` | `payment_plans[]` |
| `PaymentPlanStep` | `payment_plans[].steps[]` |
| `PropertyParking` | `parkings[]` |
| `PropertyMapPoint` | `project_map_points[]` |

### 5.9 Analytics — `PropertyAnalytics` (1:1) + existing `AnalyticsEvent`

Counters:

- views, enquiries, brochureDownloads
- whatsappClicks, callClicks
- meetings, siteVisits, conversions

Events stream into `AnalyticsEvent` for time-series; counters denormalized for list/detail performance.

### 5.10 Activity & leads

- `ActivityLog` — already exists; property entity type used for PMS audit
- `Lead.propertyId` — primary lead ↔ property mapping
- `LeadPropertyInterest` — optional multi-property interest rows for CRM workflows

### 5.11 Admin UX support tables

| Table | Purpose |
|---|---|
| `SavedPropertyFilter` | Named admin filters (JSON query + columns) |
| `PropertyDraft` | Wizard auto-save snapshots for MANUAL creates |

---

## 6. Field map — Reelly → Neon

| Reelly field | Neon target |
|---|---|
| `id` | `Property.reellyProjectId` |
| `slug_name` | `Property.reellySlug` + seed for `slug` |
| `name` | `Property.name` |
| `overview` | `Property.description` |
| `short_description` | `Property.shortDescription` |
| `construction_status` | `Property.constructionStatus` |
| `sale_status` | `Property.saleStatus` |
| `min_price` / `max_price` | `Property.minPrice` / `maxPrice` |
| `price_currency` | `Property.currency` |
| `min_size` / `max_size` / `area_unit` | Property size fields |
| `developer` | Upsert `Developer` |
| `location.*` | `PropertyAddress` + Area/City/Country links |
| `cover_image` | `PropertyImage` COVER |
| `lobby` / `interior` / `architecture` | `PropertyImage` by kind |
| `general_plan` | `PropertyImage` GENERAL_PLAN |
| `project_amenities[]` | Amenity M2M |
| `buildings[]` | `PropertyBuilding` |
| `typical_units` | `PropertyUnitType` (+ layouts) |
| `payment_plans` | `PaymentPlan` + steps |
| `floor_plans` | `PropertyFloorPlan` / documents |
| `marketing_brochure` | `PropertyBrochure` |
| `video_reviews` | `PropertyVideo` |
| `parkings` | `PropertyParking` |
| `project_map_points` | `PropertyMapPoint` |
| `escrow_number` / `has_escrow` | Property fields |
| `completion_date` | `Property.completionLabel` / possession |
| `furnishing` | `Property.furnishing` (Reelly enum values preserved as strings) |
| `post_handover`, `service_charge`, `deposit_description`, `brand`, `managing_company`, `readiness_progress` | Property columns |

Opaque / unstable fragments may additionally land in `PropertySync.lastPayload` for remapping without data loss.

---

## 7. Sync engine

### Import flow

1. List projects (`limit`/`offset` or `updated_at` window)
2. For each id: fetch detail
3. Upsert developer / geo / amenities / banks catalogs
4. Upsert Property core + Address + children (replace-set strategy per child collection)
5. Update `PropertySync` + append `PropertySyncLog`
6. Emit notification on failure

### Change detection

- Compare `contentHash` (canonical JSON of mapped fields, excluding volatile URLs if configured)
- Skip write when unchanged (`skipped++`)

### Deleted properties

- Full sync marks missing remote ids as `PROVIDER_DELETED`
- Admin can archive or keep published with warning badge

### Controls (Sync Dashboard)

- Retry Sync / Force Refresh / View Logs
- Show: Reelly status, sync status, last sync, imported, updated, API version, errors

---

## 8. Property Management UI (design contract)

Enterprise SaaS patterns (HubSpot / Stripe / Salesforce / Notion):

### List (`/admin/properties`)

- Grid view + Table view
- Bulk actions (publish, archive, feature, sync, export, delete)
- Advanced filters + **Saved filters**
- Search, pagination, column selection, import/export
- Badges: source, status, sync, featured, draft

### Details (`/admin/properties/[id]`)

Tabs:

1. Overview  
2. Pricing  
3. Location  
4. Amenities  
5. Gallery  
6. Videos  
7. Documents  
8. Banks  
9. SEO  
10. Analytics  
11. Sync Information  
12. Activity Logs  

### Manual create wizard (`/admin/properties/new`)

10 steps with **auto-save drafts** (`PropertyDraft`):

1. Basic Information  
2. Location  
3. Pricing  
4. Developer  
5. Amenities  
6. Gallery  
7. Videos  
8. Documents  
9. SEO  
10. Review & Publish  

---

## 9. LeadRat CRM (unchanged contract, property-aware)

1. Enquiry saved to Neon (`Lead`) — always  
2. Async push to LeadRat  
3. Store response on `Lead.crmResponse` + `CrmSyncLog`  
4. Update `crmSyncStatus`  
5. Never drop data if CRM is down — queue + cron retry + manual retry  

Leads always keep `propertyId` when enquiry is property-scoped so Sync / Analytics / attribution stay linked.

---

## 10. Service & repository layout

```
src/
  providers/property/
    types.ts                 # CanonicalProperty (Reelly-aligned)
    index.ts                 # registry
    reelly.provider.ts       # HTTP + map + sync
    manual.provider.ts
    reelly/
      client.ts              # fetch wrappers
      mappers.ts             # API → CanonicalProperty
      hash.ts                # content hash
  services/
    property.service.ts      # CRUD, publish, RBAC
    property-sync.service.ts # import/update/delete detection
    property-analytics.service.ts
  repositories/
    property.repository.ts
    property-media.repository.ts
    property-sync.repository.ts
    bank.repository.ts
    amenity.repository.ts
  schemas/
    property.schema.ts       # Zod for wizard + filters
  features/admin/properties/ # UI only after architecture sign-off
```

### Service responsibilities

| Service | Owns |
|---|---|
| `property.service` | List/filter, get detail DTO, manual wizard writes, publish |
| `property-sync.service` | Reelly import, update, force refresh, retry, logs |
| `property-analytics.service` | Increment counters, report aggregates |
| `lead.service` | Capture + CRM (already) — receives `propertyId` |

Repositories never call Reelly. Providers never write Prisma directly — sync service orchestrates provider → repository.

---

## 11. Implementation phases (Property module)

| Phase | Scope |
|---|---|
| **P-A** | Prisma schema + enums + migrate/push (this document) |
| **P-B** | LeadRat client, project mappers, sync service (see LEADRAT-INTEGRATION.md) |
| **P-C** | Property list UI (table/grid/filters/bulk) |
| **P-D** | Property details tabs |
| **P-E** | Manual wizard + drafts |
| **P-F** | Sync dashboard + analytics wiring |

**No UI implementation until P-A schema is applied and reviewed.**

---

## 12. Strong architectural exceptions (allowed deviations)

| Topic | Decision | Why |
|---|---|---|
| Reelly “Project” vs our “Property” | Rename in our domain only | Product language / PMS UX |
| Banks without Reelly banks array | Keep Bank M2M | Required for MANUAL + future; escrow ≠ bank catalog |
| Dual geo (catalog + Address) | Keep both | Filters/SEO need Area/Community; Address needs full precision |
| Media Library vs Property* media | Keep both | CMS uploads vs property-bound galleries |
| Raw payload on sync row | Allowed | Remap without re-fetch; debug |

We do **not** store amenities, galleries, or payment plans as JSON blobs on `Property`.

---

## 13. Acceptance criteria (architecture)

- [x] LeadRat Project fields mapped to normalized tables (see LEADRAT-INTEGRATION.md)  
- [x] Source LEADRAT / MANUAL with dedicated sync entity  
- [x] Separate images / videos / brochures / documents  
- [x] Amenities & banks as M2M  
- [x] Full address model  
- [x] Provider → Service → Repository layering documented  
- [x] Admin UI contracts (list / detail tabs / wizard / sync) specified  
- [x] Schema applied to Neon (`prisma db push`)  
- [ ] Implementation phases P-B+ — after schema approval  
