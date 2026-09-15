# LeadRat Integration Architecture

**Status:** Locked (replaces direct Reelly HTTP as inventory source)  
**Docs:** https://apidoc.leadrat.info/  
**Base URL:** `https://connect.leadrat.com/api/v1`

---

## Decision

Reelly feeds inventory into **LeadRat CRM**. REOS does **not** call the Reelly API directly.

| Flow | Direction | LeadRat API |
|------|-----------|-------------|
| Inventory sync | LeadRat → Neon | `GET /project/all`, `GET /project/{id}` (+ optional `GET /property`) |
| Lead push | Neon → LeadRat | `POST /lead` (+ status/notes updates) |
| Auth | Server only | `POST /authentication/token` |

Frontend never talks to LeadRat. Credentials stay server-side.

---

## Authentication

1. `POST /authentication/token`  
   Headers: `tenant: <subdomain>`  
   Body: `{ apiKey, secretKey }`  
2. Response: `{ accessToken, expiresIn, tokenType: "Bearer" }`  
3. All subsequent calls: `Authorization: Bearer <accessToken>`

Env (never `NEXT_PUBLIC_`):

```
LEADRAT_API_BASE_URL="https://connect.leadrat.com/api/v1"
LEADRAT_API_KEY=""
LEADRAT_SECRET_KEY=""
LEADRAT_TENANT=""
LEADRAT_ENABLED="false"
```

Shared `LeadRatClient` used by:

- `LeadRatPropertyProvider` (inventory pull)
- `LeadRatCrmProvider` (lead push)

---

## Inventory mapping (LeadRat Project → REOS Property)

LeadRat **Project** is the primary catalog entity (off-plan / developer projects — same role Reelly projects had).

| LeadRat Project | REOS |
|-----------------|------|
| `id` (GUID) | `Property.leadratProjectId` + `source = LEADRAT` |
| `name` | `Property.name` |
| `description` / `notes` | description / shortDescription |
| `status` / `currentStatus` | constructionStatus / saleStatus / publish rules |
| `minimumPrice` / `maximumPrice` | minPrice / maxPrice |
| `monetaryInfo.Currency` | currency |
| `possessionDate` / `possesionType` | possessionDate / completionLabel |
| `builderDetails` | upsert `Developer` |
| `address.*` | `PropertyAddress` (full hierarchy — do not simplify) |
| `amenities[]` | Amenity M2M |
| `associatedBanks[]` | Bank M2M (resolve IDs → bank catalog) |
| `imageUrls.*` | `PropertyImage` by gallery kind |
| `videos[]` | `PropertyVideo` |
| `brochures[]` | `PropertyBrochure` |
| `documents[]` | `PropertyDocument` / floor plans |
| blocks / unitinfo | `PropertyBuilding` / `PropertyUnitType` |

### Optional secondary sync

LeadRat **Property** (`GET /property`) = unit / resale-style records.  
Phase 1 can sync **Projects only**; enable Property sync later without changing UI contracts.

---

## Source types

```
MANUAL   — created in REOS wizard
LEADRAT  — imported/synced from LeadRat
```

`REELLY` as a direct provider source is **retired**. Reelly remains an upstream supplier to LeadRat, not a REOS provider.

---

## Provider layer

```
Property Service
      │
      ▼
Property Provider Interface
      ├── LeadRatPropertyProvider   ← primary import/sync
      └── ManualPropertyProvider
```

```
Lead Service (Neon SoT)
      │
      ▼
CRM Provider Interface
      └── LeadRatCrmProvider        ← push enquiry + retry
```

One HTTP client module: `src/providers/leadrat/`

```
src/providers/leadrat/
  client.ts          # token cache + fetch
  types.ts           # raw API DTOs
  mappers/
    project.ts       # LeadRat project → CanonicalProperty
    lead.ts          # REOS lead → LeadRat create payload
  index.ts
```

Property registry:

```
leadrat → LeadRatPropertyProvider
manual  → ManualPropertyProvider
```

---

## Sync behaviour (unchanged goals)

- Import / update / change detection (content hash)
- Soft-handle provider deletes (`PROVIDER_DELETED`)
- `PropertySync` + `PropertySyncLog`
- Never lose Neon data if LeadRat is down
- Cron + manual Force Refresh / Retry

Lead push:

1. Save lead in Neon  
2. Push to LeadRat  
3. Store response + CRM sync status  
4. Auto-retry + manual retry  

---

## Admin UI labels

| Old | New |
|-----|-----|
| Import from Reelly | Import from LeadRat |
| Reelly Properties | LeadRat Projects |
| Sync Reelly now | Sync LeadRat now |

---

## Implementation phases (revised)

| Phase | Scope |
|-------|--------|
| **P-B1** | LeadRat client (auth + token cache) |
| **P-B2** | Project mapper → CanonicalProperty + repository upsert |
| **P-B3** | Property sync service + admin import console |
| **P-B4** | LeadRat lead push (replace CRM stub) |
| **P-C+** | List / details / wizard UI |

---

## Acceptance

- [x] LeadRat API docs reviewed (https://apidoc.leadrat.info/)
- [x] Project endpoint chosen as primary inventory source
- [x] Direct Reelly provider path retired in architecture
- [x] Schema: `PropertySource.LEADRAT` + `leadratProjectId`
- [x] Shared LeadRat client implemented
- [x] Sync + lead push implemented
