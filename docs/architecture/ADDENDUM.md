# Architecture Addendum — REOS Improvements (Approved)

These deltas are **locked** into the platform before Phase 0 completion.

## Discovery as Core Product

Module: `features/property-discovery`

- Sticky filter rail + sticky Google Map (desktop split)
- Client URL state (`nuqs`) + Server Actions / Route Handlers for results
- Autocomplete / suggestions API
- Recently viewed, favourites, saved searches, compare tray
- Cursor-based pagination (infinite scroll optional)
- Public DTOs never expose `source` / provider IDs

## Builders

| Builder | Model core | Capability |
|---------|------------|------------|
| Homepage | `PageSection` on homepage `Page` | Add/remove/reorder/duplicate/enable |
| Landing pages | `LandingPage` + `PageSection` | Unlimited campaign pages + SEO |
| Forms | `Form`, `FormField`, `FormSubmission` | Contact, viewing, brochure, callback, mortgage, ads |

## Workflow

`ContentRevision` + `WorkflowState`: DRAFT → IN_REVIEW → APPROVED → PUBLISHED (reject → DRAFT). Applies to Blog, Homepage, Landing, Static Pages.

## LeadRat (CRM Provider)

```
Submit → Persist Lead (Neon SoT) → Validate → CrmProvider.push()
  success → SYNCED
  fail/down → PENDING → retry job → FAILED (manual retry)
```

Website never blocks on LeadRat. Interface: `src/providers/crm/`.

## Multi-Tenant

`Organization` is the tenant root. All domain rows carry `organizationId`. Branding, settings, users, properties, leads, SEO, and API credentials are per-org.

## AI Ready

Reserved: `src/modules/ai/` with interfaces only (`AiProvider`). No runtime calls in Phase 0–1.

## Media

`MediaFolder`, `MediaAsset`, `MediaAssetVersion`, tags, storage adapter (`Local` → `Blob` → `R2/S3`).

## Notifications

`Notification` + channels; emitters from leads, sync, workflow, system.
