import type { WorkflowState } from "@prisma/client";
import { cache } from "react";

import { requirePermission } from "@/lib/auth";
import { AppError, NotFoundError } from "@/lib/errors";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  propertyRepository,
  type PropertyListFilters,
} from "@/repositories/property.repository";
import type { CanonicalProperty } from "@/providers/property/types";
import {
  manualPropertyUploadSchema,
  marketingOffersSchema,
  type ManualPropertyUploadInput,
} from "@/schemas/property-upload.schema";

function formatMoney(
  value: { toString(): string } | number | null | undefined,
  currency = "AED",
) {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  // A zero price means "not published by the developer", never a real price.
  if (!Number.isFinite(n) || n <= 0) return null;
  // LeadRat Off Plan style: "990 283 AED"
  const grouped = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} ${currency || "AED"}`;
}

function cashbackLabel(value: { toString(): string } | null | undefined) {
  if (value == null) return null;
  const n = Number(value.toString());
  if (!Number.isFinite(n) || n <= 0) return null;
  const trimmed = Number(n.toFixed(2)).toString();
  return `${trimmed}% cashback`;
}

const VIRTUAL_TOUR_LABELS = {
  TOUR_360: "360 tour",
  VIDEO: "Video tour",
  LIVE: "Live viewing",
} as const;

function virtualTourLabel(value: keyof typeof VIRTUAL_TOUR_LABELS | null) {
  return value ? VIRTUAL_TOUR_LABELS[value] : null;
}

/**
 * Upstream feeds send "None", "Unknown", "N/A" and similar as real values.
 * Treat them as missing so the UI can fall back instead of printing them.
 */
const PLACEHOLDER_VALUES = new Set([
  "none",
  "null",
  "undefined",
  "unknown",
  "n/a",
  "na",
  "-",
  "--",
  "tba",
  "tbc",
  "not specified",
  "not available",
]);

function cleanLabel(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

/** Compact launch price for public cards, e.g. "AED 2M". */
function formatLaunchPrice(
  value: { toString(): string } | number | null | undefined,
  currency = "AED",
) {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n) || n <= 0) return null;
  const code = currency || "AED";
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    const rounded =
      millions >= 10
        ? Math.round(millions).toString()
        : (Math.round(millions * 10) / 10).toString().replace(/\.0$/, "");
    return `${code} ${rounded}M`;
  }
  if (n >= 1_000) {
    return `${code} ${Math.round(n / 1_000)}K`;
  }
  return `${code} ${Math.round(n)}`;
}

function bedroomRangeLabel(
  unitTypes: Array<{
    bedrooms: { toString(): string } | number | null;
    bedroomsLabel: string | null;
  }>,
) {
  const values = new Set<number>();
  for (const unit of unitTypes) {
    const label = unit.bedroomsLabel?.toLowerCase() ?? "";
    if (label.includes("studio")) {
      values.add(0);
      continue;
    }
    if (unit.bedrooms != null) {
      const n = Number(unit.bedrooms.toString());
      if (Number.isFinite(n)) values.add(n);
    }
  }
  if (values.size === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const format = (n: number) => (n === 0 ? "Studio" : String(n));
  if (sorted.length === 1) {
    return sorted[0] === 0 ? "Studio" : `${format(sorted[0]!)} Bedroom`;
  }
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  if (min === 0) return `Studio-${format(max)} Bedrooms`;
  return `${format(min)}-${format(max)} Bedrooms`;
}

function ownershipLabel(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const record = details as Record<string, unknown>;
  const raw =
    record.ownership ??
    record.ownershipType ??
    record.tenure ??
    record.propertyOwnership;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function paymentPlanLabel(
  depositDescription: string | null | undefined,
  plan?: {
    title: string;
    steps: Array<{ percent: { toString(): string } | null }>;
  } | null,
) {
  if (depositDescription?.includes("/")) return depositDescription.endsWith("%")
    ? depositDescription
    : `${depositDescription}%`;
  if (!plan) return null;
  const percents = plan.steps
    .map((s) => (s.percent != null ? Number(s.percent.toString()) : null))
    .filter((n): n is number => n != null && Number.isFinite(n));
  if (percents.length >= 2) {
    return `${percents[0]}/${percents[1]}%`;
  }
  return plan.title || null;
}

function buildManualDetails(
  input: ManualPropertyUploadInput,
): Record<string, unknown> {
  return {
    unitNumber: input.unitNumber,
    pinCode: input.pinCode,
    addressLine: input.addressLine,
    countryName: input.countryName,
    emirate: input.emirate,
    bedrooms: input.bedrooms,
    story: input.story,
    propertyLocation: input.propertyLocation,
    marketStatus: input.marketStatus,
    buildingName: input.buildingName,
    buildings: input.buildings,
    plottingCode: input.plottingCode,
    plottingAreaSqFt: input.plottingAreaSqFt,
    reference: input.reference,
    previousReference: input.previousReference,
    purchaseCost: input.purchaseCost,
    purchasedDate: input.purchasedDate,
    possessionHandover: input.possessionHandover,
    handoverDelay: input.handoverDelay,
    municipalityName: input.municipalityName,
    propertyTaxId: input.propertyTaxId,
    vpcNumber: input.vpcNumber,
    khateNumber: input.khateNumber,
    governmentComments: input.governmentComments,
    galleryIllustration: input.galleryIllustration,
    youtubeUrl: input.youtubeUrl,
    youtubeTitle: input.youtubeTitle,
    mapEmbedUrl: input.mapEmbedUrl,
    googleMapsUrl: input.googleMapsUrl,
  };
}

function mapManualUploadToCanonical(
  input: ManualPropertyUploadInput,
): CanonicalProperty {
  const galleryFromUploads = input.imageUrls ?? [];
  const galleryCombined = [
    ...galleryFromUploads,
    ...input.galleryUrls.filter((u) => !galleryFromUploads.includes(u)),
  ];

  const images = [
    ...(input.coverImageUrl
      ? [
          {
            url: input.coverImageUrl,
            galleryKind: "COVER" as const,
            isCover: true,
            alt: input.name,
            sortOrder: 0,
          },
        ]
      : []),
    ...galleryCombined.map((url, index) => ({
      url,
      galleryKind: "OTHER" as const,
      isCover: !input.coverImageUrl && index === 0,
      sortOrder: index + 1,
    })),
  ];

  const paymentPlans =
    input.paymentPlanTitle || input.paymentPlanSteps?.length
      ? [
          {
            title: input.paymentPlanTitle || "Payment plan",
            steps: (input.paymentPlanSteps ?? []).map((step, index) => ({
              name: step.name,
              percent: step.percent ?? null,
              sortOrder: index,
            })),
          },
        ]
      : input.depositDescription?.includes("/")
        ? [
            {
              title: input.depositDescription,
              steps: input.depositDescription
                .replace("%", "")
                .split("/")
                .map((part, index) => ({
                  name: index === 0 ? "During construction" : "On handover",
                  percent: Number(part),
                  sortOrder: index,
                })),
            },
          ]
        : undefined;

  const price = input.price ?? input.minPrice;
  const buildingsCount =
    input.buildingCount ??
    (input.buildings != null && input.buildings !== ""
      ? Number(input.buildings)
      : null);
  const plotSize = input.plottingAreaSqFt ?? input.minSize;

  const videos = input.youtubeUrl
    ? [
        {
          title: input.youtubeTitle || "YouTube video",
          url: input.youtubeUrl,
          provider: "youtube",
          sortOrder: 0,
        },
      ]
    : undefined;

  const mapLabel =
    input.mapLocation ||
    [input.propertyLocation, input.cityName || "Dubai", "UAE"]
      .filter(Boolean)
      .join(", ");

  return {
    source: "MANUAL",
    name: input.name,
    slug: input.slug ?? undefined,
    status: input.status,
    shortDescription: input.shortDescription,
    description: input.description,
    saleStatus: input.saleStatus ?? input.marketStatus,
    constructionStatus: input.constructionStatus,
    completionLabel: input.completionLabel,
    possessionDate: input.possessionDate ?? input.purchasedDate,
    minPrice: price,
    maxPrice: input.maxPrice ?? price,
    currency: input.currency || "AED",
    minSize: plotSize,
    maxSize: input.maxSize ?? plotSize,
    areaUnit: input.areaUnit ?? "sqft",
    depositDescription: input.depositDescription,
    serviceCharge: input.serviceCharge,
    website: input.website,
    unitsCount: input.unitsCount ?? undefined,
    buildingCount:
      buildingsCount != null && Number.isFinite(buildingsCount)
        ? buildingsCount
        : undefined,
    isFeatured: input.isFeatured,
    isVerified: input.isVerified,
    developer: input.developerName
      ? { name: input.developerName }
      : undefined,
    city: { name: input.cityName || "Dubai" },
    area: input.areaName
      ? { name: input.areaName }
      : input.propertyLocation
        ? { name: input.propertyLocation }
        : undefined,
    community: input.communityName ? { name: input.communityName } : undefined,
    country: {
      name: input.countryName || "United Arab Emirates",
      isoCode: "AE",
    },
    propertyType: input.propertyTypeName
      ? { name: input.propertyTypeName }
      : undefined,
    category: input.categoryName ? { name: input.categoryName } : undefined,
    address: {
      country: input.countryName || "United Arab Emirates",
      state: input.emirate || "Dubai",
      city: input.cityName || "Dubai",
      locality: input.addressLine,
      district: input.propertyLocation,
      tower: input.buildingName,
      latitude: input.latitude,
      longitude: input.longitude,
      mapLocation: mapLabel,
      googlePlaceId: input.googleMapsUrl,
    },
    amenities: input.amenities.map((name) => ({ name })),
    images,
    videos,
    paymentPlans,
    seo: {
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      ogTitle: input.ogTitle || input.metaTitle,
      ogDescription: input.ogDescription || input.metaDescription,
      twitterTitle: input.twitterTitle || input.ogTitle || input.metaTitle,
      twitterDescription:
        input.twitterDescription ||
        input.ogDescription ||
        input.metaDescription,
      keywords: input.seoKeywords,
    },
    details: buildManualDetails(input),
    raw: input,
  };
}

function normalizeJsonPropertyPayload(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.properties)) return obj.properties;
    if (Array.isArray(obj.items)) return obj.items;
    if (typeof obj.name === "string") return [obj];
  }
  throw new AppError(
    "Invalid JSON. Provide a property object, { properties: [] }, or an array.",
    { code: "VALIDATION", status: 400 },
  );
}

function mapJsonItemToCanonical(item: unknown): CanonicalProperty {
  if (!item || typeof item !== "object") {
    throw new AppError("Each property must be an object", {
      code: "VALIDATION",
      status: 400,
    });
  }

  const row = item as Record<string, unknown>;

  if (
    typeof row.name === "string" &&
    !row.developer &&
    (row.developerName || row.coverImageUrl || row.galleryUrls || row.amenities)
  ) {
    return mapManualUploadToCanonical(manualPropertyUploadSchema.parse(row));
  }

  const name = String(row.name ?? "").trim();
  if (name.length < 2) {
    throw new AppError("Property name is required in JSON", {
      code: "VALIDATION",
      status: 400,
    });
  }

  const developer =
    row.developer && typeof row.developer === "object"
      ? (row.developer as CanonicalProperty["developer"])
      : typeof row.developerName === "string"
        ? { name: row.developerName }
        : undefined;

  const images = Array.isArray(row.images)
    ? (row.images as CanonicalProperty["images"])
    : undefined;

  const amenities = Array.isArray(row.amenities)
    ? (row.amenities as Array<string | { name: string }>).map((a) =>
        typeof a === "string" ? { name: a } : a,
      )
    : undefined;

  return {
    ...(row as object),
    source: "MANUAL",
    name,
    currency:
      typeof row.currency === "string" && row.currency ? row.currency : "AED",
    developer,
    images,
    amenities,
    leadratProjectId: null,
    raw: item,
  } as CanonicalProperty;
}

/**
 * Show every published listing. Cards without photos already render a
 * "Photos coming soon" placeholder. Auto-sync is not allowed to wipe
 * existing media when the list payload has no images.
 */
const PUBLIC_LISTINGS_REQUIRE_MEDIA = false;

const getPublishedBySlugCached = cache(async (slug: string) => {
  const org = await organizationRepository.getDefault();
  if (!org) throw new NotFoundError("Organization not found");

  const property = await propertyRepository.findPublishedBySlug(org.id, slug);
  if (!property) throw new NotFoundError("Property not found");

  return {
    ...property,
    saleStatus: cleanLabel(property.saleStatus),
    constructionStatus: cleanLabel(property.constructionStatus),
    completionLabel: cleanLabel(property.completionLabel),
    minPriceLabel: formatMoney(property.minPrice, property.currency),
    maxPriceLabel: formatMoney(property.maxPrice, property.currency),
    paymentPlanLabel: paymentPlanLabel(
      property.depositDescription,
      property.paymentPlans[0] ?? null,
    ),
  };
});

export const propertyService = {
  async listPublished(
    filters: Omit<PropertyListFilters, "organizationId" | "status"> & {
      organizationId?: string;
    } = {},
  ) {
    let organizationId = filters.organizationId;
    if (!organizationId) {
      const org = await organizationRepository.getDefault();
      if (!org) {
        return { items: [], total: 0, page: 1, pageSize: 24, pageCount: 1 };
      }
      organizationId = org.id;
    }

    const result = await propertyRepository.listPublished({
      requireMedia: PUBLIC_LISTINGS_REQUIRE_MEDIA,
      ...filters,
      organizationId,
    });

    return {
      ...result,
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        status: item.status,
        saleStatus: cleanLabel(item.saleStatus),
        constructionStatus: cleanLabel(item.constructionStatus),
        completionStatus: item.completionStatus,
        completionLabel: cleanLabel(item.completionLabel),
        currency: item.currency,
        minPriceLabel: formatMoney(item.minPrice, item.currency),
        maxPriceLabel: formatMoney(item.maxPrice, item.currency),
        launchPriceLabel: formatLaunchPrice(item.minPrice, item.currency),
        paymentPlanLabel: paymentPlanLabel(
          item.depositDescription,
          item.paymentPlans[0] ?? null,
        ),
        bedroomLabel: bedroomRangeLabel(item.unitTypes ?? []),
        ownershipLabel: ownershipLabel(item.details),
        cashbackLabel: cashbackLabel(item.cashbackPercent),
        virtualTourLabel: virtualTourLabel(item.virtualTour),
        isFeatured: item.isFeatured,
        developer: item.developer,
        area: item.area,
        community: item.community,
        city: item.city,
        propertyType: item.propertyType,
        coverImage: item.images[0] ?? null,
        shortDescription: item.shortDescription,
      })),
    };
  },

  async listPublishedFacets() {
    const org = await organizationRepository.getDefault();
    if (!org) return { types: [], amenities: [] };
    return propertyRepository.listPublishedFacets(org.id);
  },

  /**
   * Nearby/related inventory for the detail page, widened from community to
   * area to developer until enough cards are found.
   */
  async listSimilar(input: {
    excludeId: string;
    areaId?: string | null;
    communityId?: string | null;
    developerId?: string | null;
    propertyTypeId?: string | null;
    take?: number;
  }) {
    const org = await organizationRepository.getDefault();
    if (!org) return [];

    const take = input.take ?? 3;
    const rows = await propertyRepository.listSimilar({
      organizationId: org.id,
      ...input,
      take,
    });

    return rows.map((item) => ({
      name: item.name,
      slug: item.slug,
      saleStatus: cleanLabel(item.saleStatus),
      completionLabel: cleanLabel(item.completionLabel),
      minPriceLabel: formatMoney(item.minPrice, item.currency),
      launchPriceLabel: formatLaunchPrice(item.minPrice, item.currency),
      bedroomLabel: bedroomRangeLabel(item.unitTypes ?? []),
      ownershipLabel: ownershipLabel(item.details),
      propertyType: item.propertyType,
      developer: item.developer,
      community: item.community,
      area: item.area,
      city: item.city,
      coverImage: item.images[0] ?? null,
    }));
  },

  async getPublishedBySlug(slug: string) {
    return getPublishedBySlugCached(slug);
  },

  async listAdmin(
    filters: Omit<PropertyListFilters, "organizationId"> & {
      organizationId?: string;
    },
  ) {
    await requirePermission("property:read");

    let organizationId = filters.organizationId;
    if (!organizationId) {
      const org = await organizationRepository.getDefault();
      if (!org) return { items: [], total: 0, page: 1, pageSize: 24, pageCount: 1 };
      organizationId = org.id;
    }

    const result = await propertyRepository.listAdmin({
      ...filters,
      organizationId,
    });

    return {
      ...result,
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        status: item.status,
        source: item.source,
        saleStatus: item.saleStatus,
        constructionStatus: item.constructionStatus,
        completionLabel: item.completionLabel,
        currency: item.currency,
        minPriceLabel: formatMoney(item.minPrice, item.currency),
        maxPriceLabel: formatMoney(item.maxPrice, item.currency),
        paymentPlanLabel: paymentPlanLabel(
          item.depositDescription,
          item.paymentPlans[0] ?? null,
        ),
        isFeatured: item.isFeatured,
        leadratProjectId: item.leadratProjectId,
        developer: item.developer,
        area: item.area,
        community: item.community,
        city: item.city,
        propertyType: item.propertyType,
        coverImage: item.images[0] ?? null,
        amenityCount: item._count.amenities,
        imageCount: item._count.images,
        sync: item.sync,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
      })),
    };
  },

  async getAdminDetail(id: string) {
    await requirePermission("property:read");
    const org = await organizationRepository.getDefault();
    if (!org) throw new NotFoundError("Organization not found");

    const property = await propertyRepository.findByIdForAdmin(org.id, id);
    if (!property) throw new NotFoundError("Property not found");
    return property;
  },

  async setPublishStatus(id: string, published: boolean) {
    await requirePermission("property:publish");
    const org = await organizationRepository.getDefault();
    if (!org) throw new NotFoundError("Organization not found");

    const updated = await propertyRepository.setPublishStatus(
      org.id,
      id,
      published ? "PUBLISHED" : "DRAFT",
    );
    if (!updated) throw new NotFoundError("Property not found");
    return updated;
  },

  async setMarketingOffers(raw: unknown) {
    await requirePermission("property:update");
    const org = await organizationRepository.getDefault();
    if (!org) throw new NotFoundError("Organization not found");

    const input = marketingOffersSchema.parse(raw);
    const updated = await propertyRepository.setMarketingOffers(
      org.id,
      input.propertyId,
      {
        cashbackPercent: input.cashbackPercent ?? null,
        virtualTour: input.virtualTour ?? null,
      },
    );
    if (!updated) throw new NotFoundError("Property not found");
    return updated;
  },

  async createManual(raw: unknown) {
    await requirePermission("property:create");
    const org = await organizationRepository.getDefault();
    if (!org) throw new NotFoundError("Organization not found");

    const parsed = manualPropertyUploadSchema.parse(raw);
    const canonical = mapManualUploadToCanonical(parsed);
    const result = await propertyRepository.upsertFromCanonical(
      org.id,
      canonical,
    );

    // Prefer catalog IDs from the form when provided (bypass name-based geo)
    if (
      parsed.developerId ||
      parsed.agentId ||
      parsed.cityId ||
      parsed.areaId ||
      parsed.communityId ||
      parsed.categoryId ||
      parsed.propertyTypeId
    ) {
      await propertyRepository.patchManualRelations(org.id, result.property.id, {
        developerId: parsed.developerId,
        agentId: parsed.agentId,
        cityId: parsed.cityId,
        areaId: parsed.areaId,
        communityId: parsed.communityId,
        categoryId: parsed.categoryId,
        propertyTypeId: parsed.propertyTypeId,
      });
    }

    return result.property;
  },

  /**
   * Write path for the agent portal and for the reviewer applying an approved
   * edit. Authorization happens in the caller — the portal checks
   * portal:property, the review queue checks submission:review — because the
   * same mapping serves both sides.
   */
  async upsertFromPortal(
    raw: unknown,
    options: {
      organizationId: string;
      agentId: string;
      propertyId?: string | null;
      status: "DRAFT" | "PUBLISHED";
      workflowState: WorkflowState;
    },
  ) {
    const existing = options.propertyId
      ? await propertyRepository.findOwnedByAgent(
          options.organizationId,
          options.agentId,
          options.propertyId,
        )
      : null;

    if (options.propertyId && !existing) {
      throw new NotFoundError("Listing not found");
    }

    const parsed = manualPropertyUploadSchema.parse({
      ...(raw as Record<string, unknown>),
      status: options.status,
      // Keep the slug stable so the upsert lands on the same row and public
      // URLs survive an edit.
      slug: existing?.slug ?? (raw as { slug?: string | null })?.slug ?? null,
      agentId: options.agentId,
    });

    const canonical = mapManualUploadToCanonical(parsed);
    const result = await propertyRepository.upsertFromCanonical(
      options.organizationId,
      canonical,
    );

    await propertyRepository.patchManualRelations(
      options.organizationId,
      result.property.id,
      { agentId: options.agentId },
    );

    await propertyRepository.setPortalWorkflow(
      options.organizationId,
      result.property.id,
      {
        workflowState: options.workflowState,
        status: options.status,
        publish: options.status === "PUBLISHED",
      },
    );

    return result.property;
  },

  async assignAgent(raw: unknown) {
    await requirePermission("property:update");
    const org = await organizationRepository.getDefault();
    if (!org) throw new NotFoundError("Organization not found");
    const { assignPropertyAgentSchema } = await import(
      "@/schemas/catalog.schema"
    );
    const parsed = assignPropertyAgentSchema.parse(raw);
    const updated = await propertyRepository.assignAgent(
      org.id,
      parsed.propertyId,
      parsed.agentId,
    );
    if (!updated) throw new NotFoundError("Property or agent not found");
    return updated;
  },

  async importManualJson(raw: unknown) {
    await requirePermission("property:create");
    const org = await organizationRepository.getDefault();
    if (!org) throw new NotFoundError("Organization not found");

    const items = normalizeJsonPropertyPayload(raw);
    if (items.length === 0) {
      throw new AppError("JSON must contain at least one property object", {
        code: "VALIDATION",
        status: 400,
      });
    }
    if (items.length > 50) {
      throw new AppError("Import up to 50 properties per request", {
        code: "VALIDATION",
        status: 400,
      });
    }

    const results: Array<{
      id: string;
      name: string;
      action: string;
      error?: string;
    }> = [];

    for (const item of items) {
      try {
        const canonical = mapJsonItemToCanonical(item);
        const result = await propertyRepository.upsertFromCanonical(
          org.id,
          canonical,
        );
        results.push({
          id: result.property.id,
          name: result.property.name,
          action: result.action,
        });
      } catch (error) {
        results.push({
          id: "",
          name: String((item as { name?: string })?.name ?? "Unknown"),
          action: "failed",
          error: error instanceof Error ? error.message : "Import failed",
        });
      }
    }

    return {
      total: items.length,
      imported: results.filter((r) => r.action === "imported").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
      failed: results.filter((r) => r.action === "failed").length,
      results,
    };
  },
};
