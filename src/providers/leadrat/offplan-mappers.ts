import type {
  CanonicalPaymentPlan,
  CanonicalProperty,
  GalleryKind,
} from "@/providers/property/types";
import { slugify } from "@/lib/utils";
import type {
  OffPlanListingCard,
  OffPlanProjectDetail,
} from "./offplan-client";
import { hashCanonicalProperty } from "./mappers";

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function preferUrl(
  primary?: string | null,
  fallback?: string | null,
): string | null {
  const a = primary?.trim();
  const b = fallback?.trim();
  // Prefer stable Reelly / non-signed URLs when both exist
  if (b && /reelly-backend\.s3\.amazonaws\.com/i.test(b)) return b;
  if (a && !/[?&]X-Amz-/i.test(a)) return a;
  if (b) return b;
  return a || null;
}

function galleryKindFromCategory(category?: string | null): GalleryKind {
  const k = (category ?? "").toLowerCase();
  if (k.includes("cover")) return "COVER";
  if (k.includes("lobby")) return "LOBBY";
  if (k.includes("interior")) return "INTERIOR";
  if (k.includes("architect") || k.includes("exterior")) return "ARCHITECTURE";
  if (k.includes("plan") || k.includes("master") || k.includes("general"))
    return "GENERAL_PLAN";
  if (k.includes("layout") || k.includes("unit")) return "UNIT_LAYOUT";
  return "OTHER";
}

function paymentRatio(
  pre?: number | null,
  post?: number | null,
): string | null {
  const a = asNumber(pre);
  const b = asNumber(post);
  if (a == null || b == null) return null;
  return `${a}/${b}%`;
}

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  apartment: "Apartment",
  apartments: "Apartment",
  flat: "Apartment",
  flats: "Apartment",
  villa: "Villa",
  villas: "Villa",
  townhouse: "Townhouse",
  townhouses: "Townhouse",
  "town house": "Townhouse",
  penthouse: "Penthouse",
  penthouses: "Penthouse",
  duplex: "Duplex",
  studio: "Studio",
};

/** Normalize Off Plan unit-class labels into catalog property types. */
export function normalizeOffPlanPropertyType(
  raw?: string | null,
): string | null {
  const key = raw?.trim().toLowerCase();
  if (!key) return null;
  if (PROPERTY_TYPE_ALIASES[key]) return PROPERTY_TYPE_ALIASES[key]!;
  // Title-case unknown but non-empty labels so facets stay readable.
  return raw!
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Pick the dominant unit class from bedroom groups (by unitCount),
 * falling back to the first named group.
 */
export function inferPropertyTypeFromOffPlan(
  listing: OffPlanListingCard | OffPlanProjectDetail,
): string | null {
  const detail = listing as OffPlanProjectDetail;
  const groups = detail.unitSummary?.bedroomGroups ?? [];
  let best: { name: string; count: number } | null = null;

  for (const group of groups) {
    const name = normalizeOffPlanPropertyType(group.unitType);
    if (!name) continue;
    const count = asNumber(group.unitCount) ?? 0;
    if (!best || count > best.count) best = { name, count };
  }

  if (best) return best.name;

  for (const unit of detail.typicalUnits ?? []) {
    const name = normalizeOffPlanPropertyType(
      (unit as { unitType?: string | null }).unitType,
    );
    if (name) return name;
  }

  return null;
}

function mapPaymentPlans(
  project: OffPlanListingCard | OffPlanProjectDetail,
): CanonicalPaymentPlan[] | undefined {
  const plans = project.paymentPlans;
  if (!plans?.length) return undefined;

  return plans.map((plan, index) => {
    const detailed = plan as {
      id?: string;
      name?: string | null;
      preHandoverPercentage?: number | null;
      postHandoverPercentage?: number | null;
      steps?: Array<{
        name?: string;
        percentage?: number | null;
        displayOrder?: number | null;
      }>;
    };

    const ratio = paymentRatio(
      detailed.preHandoverPercentage,
      detailed.postHandoverPercentage,
    );

    return {
      externalId: detailed.id ?? null,
      title: detailed.name ?? (ratio ? `${ratio} Payment Plan` : `Plan ${index + 1}`),
      steps: detailed.steps?.length
        ? detailed.steps.map((step, stepIndex) => ({
            name: step.name ?? `Step ${stepIndex + 1}`,
            percent: asNumber(step.percentage),
            sortOrder: step.displayOrder ?? stepIndex,
          }))
        : ratio
          ? [
              {
                name: "During construction",
                percent: asNumber(detailed.preHandoverPercentage),
                sortOrder: 0,
              },
              {
                name: "On handover",
                percent: asNumber(detailed.postHandoverPercentage),
                sortOrder: 1,
              },
            ]
          : undefined,
    };
  });
}

export function mapOffPlanListingToCanonical(
  listing: OffPlanListingCard | OffPlanProjectDetail,
): CanonicalProperty {
  const detail = listing as OffPlanProjectDetail;
  const name = (listing.name ?? "Untitled Project").trim();
  const currency =
    detail.currency ?? listing.priceCurrency ?? "AED";

  const images: NonNullable<CanonicalProperty["images"]> = [];
  let order = 0;

  const coverUrl = preferUrl(
    listing.coverImageUrl,
    listing.coverImageFallbackUrl,
  );
  if (coverUrl) {
    images.push({
      url: coverUrl,
      galleryKind: "COVER",
      alt: name,
      sortOrder: order++,
      isCover: true,
    });
  }

  for (const item of detail.galleryImages ?? []) {
    const url = preferUrl(item.imageUrl, item.imageFallbackUrl);
    if (!url) continue;
    // Skip duplicate of cover
    if (images.some((i) => i.url === url)) continue;
    const kind = galleryKindFromCategory(item.category);
    images.push({
      url,
      galleryKind: kind,
      caption: item.caption ?? null,
      alt: item.caption ?? name,
      sortOrder: item.displayOrder ?? order++,
      isCover: kind === "COVER" && !images.some((i) => i.isCover),
      externalId: item.id ?? null,
    });
  }

  if (!images.some((i) => i.isCover) && images[0]) {
    images[0].isCover = true;
    images[0].galleryKind = "COVER";
  }

  const documents: NonNullable<CanonicalProperty["documents"]> = [];
  for (const [index, doc] of (detail.documents ?? []).entries()) {
    const url = preferUrl(doc.url, doc.fallbackUrl);
    if (!url) continue;
    documents.push({
      title: doc.name ?? "Document",
      kind: doc.type ?? "OTHER",
      url,
      sortOrder: doc.displayOrder ?? index,
    });
  }

  const brochures =
    preferUrl(detail.generalPlanUrl, null)
      ? [
          {
            title: "Master plan",
            url: preferUrl(detail.generalPlanUrl, null)!,
            sortOrder: 0,
          },
        ]
      : undefined;

  const videos = detail.videoReviewUrl
    ? [
        {
          title: "Video review",
          url: detail.videoReviewUrl,
          sortOrder: 0,
        },
      ]
    : undefined;

  const paymentPlans = mapPaymentPlans(listing);
  const firstPlan = listing.paymentPlans?.[0];
  const depositDescription = paymentRatio(
    firstPlan?.preHandoverPercentage ?? listing.preHandoverPercentage,
    firstPlan?.postHandoverPercentage ?? listing.postHandoverPercentage,
  );

  const developerName =
    detail.developer?.name?.trim() ||
    listing.developerName?.trim() ||
    null;

  const cityName = detail.city ?? null;
  const districtName = listing.district ?? detail.district ?? null;

  const reellyId =
    detail.externalId != null ? String(detail.externalId) : null;

  const propertyTypeName = inferPropertyTypeFromOffPlan(listing);

  const unitTypesFromGroups = (detail.unitSummary?.bedroomGroups ?? [])
    .map((group, index) => {
      const unitType = normalizeOffPlanPropertyType(group.unitType);
      const bedrooms = asNumber(group.bedrooms);
      return {
        externalId: null as string | null,
        name:
          group.bedroomLabel?.trim() ||
          (bedrooms != null ? `${bedrooms} Bedroom` : `Unit ${index + 1}`),
        unitType,
        normalizedType: unitType,
        bedrooms,
        bedroomsLabel: group.bedroomLabel ?? null,
        unitsAmount: asNumber(group.unitCount),
        areaFrom: asNumber(group.minSize),
        areaTo: asNumber(group.maxSize),
        priceFrom: asNumber(group.minPrice),
        priceTo: asNumber(group.maxPrice),
        sizeFromSqft: asNumber(group.minSize),
        sizeToSqft: asNumber(group.maxSize),
        typicalImageUrl: group.floorPlanImageUrl ?? null,
      };
    })
    .filter((u) => Boolean(u.name || u.unitType));

  const unitTypesFromTypical =
    detail.typicalUnits?.map((u, index) => {
      const unitType = normalizeOffPlanPropertyType(u.unitType);
      return {
        externalId: u.id ?? null,
        name:
          u.bedrooms != null ? `${u.bedrooms} Bedroom` : `Unit ${index + 1}`,
        unitType,
        normalizedType: unitType,
        bedrooms: u.bedrooms ?? null,
        bedroomsLabel:
          u.bedrooms != null ? `${u.bedrooms} Bedroom` : null,
        areaFrom: u.area ?? null,
        areaTo: u.area ?? null,
        priceFrom: u.price ?? null,
        priceTo: u.price ?? null,
        sizeFromSqft: u.area ?? null,
        sizeToSqft: u.area ?? null,
      };
    }) ?? [];

  return {
    source: "LEADRAT",
    leadratProjectId: listing.id,
    reellyProjectId: reellyId,
    name,
    slug: slugify(name),
    description: detail.description ?? null,
    shortDescription: detail.shortDescription ?? null,
    propertyType: propertyTypeName
      ? { name: propertyTypeName }
      : undefined,
    constructionStatus: listing.constructionStatus ?? null,
    saleStatus: listing.saleStatus ?? null,
    completionLabel:
      listing.completionQuarter ?? detail.completionQuarter ?? null,
    possessionDate: (() => {
      const raw =
        listing.completionDate ??
        (detail as { completionDateTime?: string | null }).completionDateTime ??
        null;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : raw;
    })(),
    minPrice: asNumber(listing.minPrice),
    maxPrice: asNumber(listing.maxPrice),
    currency: String(currency || "AED"),
    minSize: asNumber(listing.minSize),
    maxSize: asNumber(listing.maxSize),
    areaUnit: detail.areaUnit ?? "sqft",
    serviceCharge:
      detail.serviceCharge != null ? String(detail.serviceCharge) : null,
    depositDescription,
    buildingCount: asNumber(listing.buildingCount),
    unitsCount: asNumber(listing.unitCount ?? detail.unitSummary?.totalAvailableUnits),
    isFeatured: Boolean(listing.isRecommended),
    postHandover: Boolean(detail.postHandover),
    readinessProgress: asNumber(detail.readinessProgress),
    managingCompany: detail.managingCompany ?? null,
    brand: detail.brand ?? null,
    escrowNumber: detail.escrowNumber ?? null,
    developer: developerName
      ? {
          name: developerName,
          logoUrl:
            preferUrl(detail.developer?.logoUrl, listing.developerLogo) ??
            null,
          website: detail.developer?.website ?? null,
          externalId: detail.developer?.id ?? null,
        }
      : undefined,
    address: {
      country: detail.country ?? null,
      city: cityName,
      district: districtName,
      locality: districtName,
      community: districtName,
      latitude: asNumber(listing.latitude),
      longitude: asNumber(listing.longitude),
      mapLocation: detail.fullAddress ?? null,
    },
    community: districtName ? { name: districtName } : undefined,
    area: districtName ? { name: districtName } : undefined,
    city: cityName ? { name: cityName } : undefined,
    country: detail.country ? { name: detail.country } : undefined,
    amenities: (detail.amenities ?? [])
      .filter((a): a is { id?: string; name: string; iconUrl?: string | null } =>
        Boolean(a?.name),
      )
      .map((a) => ({
        externalId: a.id ?? null,
        name: a.name,
        iconUrl: a.iconUrl ?? null,
      })),
    images,
    videos,
    brochures,
    documents,
    paymentPlans,
    unitTypes:
      unitTypesFromGroups.length > 0
        ? unitTypesFromGroups
        : unitTypesFromTypical,
    providerUpdatedAt: detail.updatedAt ?? null,
    raw: listing,
  };
}

export { hashCanonicalProperty };
