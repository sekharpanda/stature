import {
  Prisma,
  type PropertyStatus,
  type VirtualTourType,
  type WorkflowState,
} from "@prisma/client";

import { computeListPriority } from "@/config/priority-developers";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { CanonicalProperty } from "@/providers/property/types";
import { hashCanonicalProperty } from "@/providers/leadrat";

function dec(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return new Prisma.Decimal(value);
}

function toValidDate(value?: string | Date | null) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function deriveCompletionStatus(
  constructionStatus?: string | null,
  explicit?: string | null,
): "READY" | "OFF_PLAN" | "UNDER_CONSTRUCTION" | undefined {
  const fromExplicit = (explicit || "").toUpperCase().replace(/-/g, "_");
  if (
    fromExplicit === "READY" ||
    fromExplicit === "OFF_PLAN" ||
    fromExplicit === "UNDER_CONSTRUCTION"
  ) {
    return fromExplicit;
  }
  const s = (constructionStatus || "").toLowerCase();
  if (!s) return "OFF_PLAN";
  if (s.includes("ready") || s.includes("completed") || s.includes("handed")) {
    return "READY";
  }
  if (s.includes("under")) return "UNDER_CONSTRUCTION";
  if (s.includes("off")) return "OFF_PLAN";
  // LeadRat off-plan feed often sends "Unknown"
  return "OFF_PLAN";
}

async function uniqueSlug(
  organizationId: string,
  base: string,
  excludeId?: string,
) {
  const slug = slugify(base) || "property";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.property.findFirst({
      where: {
        organizationId,
        slug: candidate,
        // Slug unique index ignores soft-delete — must check all rows
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
  }
}

async function upsertDeveloper(
  organizationId: string,
  developer?: CanonicalProperty["developer"],
): Promise<{ id: string; name: string; listPriority: number } | null> {
  if (!developer?.name) return null;
  const slug = slugify(developer.name);
  const existing = await prisma.developer.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      OR: [
        ...(developer.externalId
          ? [{ externalId: developer.externalId }]
          : []),
        { slug },
        { name: developer.name },
      ],
    },
  });
  if (existing) {
    if (developer.logoUrl && developer.logoUrl !== existing.logoUrl) {
      await prisma.developer.update({
        where: { id: existing.id },
        data: { logoUrl: developer.logoUrl },
      });
    }
    return {
      id: existing.id,
      name: existing.name,
      listPriority: existing.listPriority,
    };
  }

  const created = await prisma.developer.create({
    data: {
      organizationId,
      name: developer.name,
      slug,
      website: developer.website ?? undefined,
      logoUrl: developer.logoUrl ?? undefined,
      externalId: developer.externalId ?? undefined,
      source: "LEADRAT",
      isPublished: true,
    },
  });
  return {
    id: created.id,
    name: created.name,
    listPriority: created.listPriority,
  };
}

async function upsertGeo(organizationId: string, input: CanonicalProperty) {
  let countryId: string | null = null;
  let cityId: string | null = null;
  let areaId: string | null = null;
  let communityId: string | null = null;

  if (input.country?.name) {
    const slug = slugify(input.country.name);
    const country =
      (await prisma.country.findFirst({
        where: { organizationId, slug, deletedAt: null },
      })) ??
      (await prisma.country.create({
        data: {
          organizationId,
          name: input.country.name,
          slug,
          isoCode: input.country.isoCode ?? undefined,
        },
      }));
    countryId = country.id;
  }

  if (input.city?.name && countryId) {
    const slug = slugify(input.city.name);
    const city =
      (await prisma.city.findFirst({
        where: { organizationId, slug, deletedAt: null },
      })) ??
      (await prisma.city.create({
        data: {
          organizationId,
          countryId,
          name: input.city.name,
          slug,
        },
      }));
    cityId = city.id;
  }

  if (input.area?.name && cityId) {
    const slug = slugify(input.area.name);
    const area =
      (await prisma.area.findFirst({
        where: { organizationId, slug, deletedAt: null },
      })) ??
      (await prisma.area.create({
        data: {
          organizationId,
          cityId,
          name: input.area.name,
          slug,
          isPublished: true,
        },
      }));
    areaId = area.id;
  }

  if (input.community?.name && areaId) {
    const slug = slugify(input.community.name);
    const community =
      (await prisma.community.findFirst({
        where: { organizationId, slug, deletedAt: null },
      })) ??
      (await prisma.community.create({
        data: {
          organizationId,
          areaId,
          name: input.community.name,
          slug,
          isPublished: true,
        },
      }));
    communityId = community.id;
  }

  return { countryId, cityId, areaId, communityId };
}

async function upsertPropertyType(
  organizationId: string,
  propertyType?: CanonicalProperty["propertyType"],
) {
  if (!propertyType?.name) return null;
  const slug = slugify(propertyType.name);
  const existing = await prisma.propertyType.findFirst({
    where: { organizationId, slug, deletedAt: null },
  });
  if (existing) return existing.id;
  const created = await prisma.propertyType.create({
    data: { organizationId, name: propertyType.name, slug },
  });
  return created.id;
}

async function upsertCategory(
  organizationId: string,
  category?: CanonicalProperty["category"],
) {
  if (!category?.name) return null;
  const slug = slugify(category.name);
  const existing = await prisma.propertyCategory.findFirst({
    where: { organizationId, slug, deletedAt: null },
  });
  if (existing) return existing.id;
  const created = await prisma.propertyCategory.create({
    data: { organizationId, name: category.name, slug },
  });
  return created.id;
}

async function syncAmenities(
  organizationId: string,
  propertyId: string,
  amenities: CanonicalProperty["amenities"],
) {
  await prisma.propertyAmenity.deleteMany({ where: { propertyId } });
  if (!amenities?.length) return;

  const linked = new Set<string>();
  for (const item of amenities) {
    const slug = slugify(item.name);
    let amenity = await prisma.amenity.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          ...(item.externalId ? [{ externalId: item.externalId }] : []),
          { slug },
        ],
      },
    });
    if (!amenity) {
      amenity = await prisma.amenity.create({
        data: {
          organizationId,
          name: item.name,
          slug,
          externalId: item.externalId ?? undefined,
          iconUrl: item.iconUrl ?? undefined,
        },
      });
    }
    if (linked.has(amenity.id)) continue;
    linked.add(amenity.id);
    await prisma.propertyAmenity.create({
      data: {
        propertyId,
        amenityId: amenity.id,
        externalId: item.externalId ?? undefined,
        iconUrl: item.projectIconUrl ?? undefined,
      },
    });
  }
}

async function syncBanks(
  organizationId: string,
  propertyId: string,
  banks: CanonicalProperty["banks"],
) {
  await prisma.propertyBank.deleteMany({ where: { propertyId } });
  if (!banks?.length) return;

  for (const item of banks) {
    const slug = slugify(item.name);
    let bank = await prisma.bank.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          ...(item.externalId ? [{ externalId: item.externalId }] : []),
          { slug },
        ],
      },
    });
    if (!bank) {
      bank = await prisma.bank.create({
        data: {
          organizationId,
          name: item.name,
          slug,
          externalId: item.externalId ?? undefined,
          logoUrl: item.logoUrl ?? undefined,
        },
      });
    }
    await prisma.propertyBank.create({
      data: { propertyId, bankId: bank.id },
    });
  }
}

async function replaceChildren(propertyId: string, input: CanonicalProperty) {
  // Never wipe media when the incoming payload has no items — list-only syncs
  // previously deleted covers and left the public grid with placeholders.
  if (input.images && input.images.length > 0) {
    await prisma.propertyImage.deleteMany({ where: { propertyId } });
  }
  if (input.videos && input.videos.length > 0) {
    await prisma.propertyVideo.deleteMany({ where: { propertyId } });
  }
  if (input.brochures && input.brochures.length > 0) {
    await prisma.propertyBrochure.deleteMany({ where: { propertyId } });
  }
  if (input.documents && input.documents.length > 0) {
    await prisma.propertyDocument.deleteMany({ where: { propertyId } });
  }

  if (input.images?.length) {
    await prisma.propertyImage.createMany({
      data: input.images.map((img, index) => ({
        propertyId,
        url: img.url,
        galleryKind: img.galleryKind,
        caption: img.caption ?? undefined,
        alt: img.alt ?? undefined,
        mime: img.mime ?? undefined,
        sizeBytes: img.sizeBytes ?? undefined,
        width: img.width ?? undefined,
        height: img.height ?? undefined,
        sortOrder: img.sortOrder ?? index,
        isCover: img.isCover ?? false,
        externalId: img.externalId ?? undefined,
      })),
    });
  }

  if (input.videos?.length) {
    await prisma.propertyVideo.createMany({
      data: input.videos
        .filter((v) => v.url || v.videoFileUrl)
        .map((video, index) => ({
          propertyId,
          title: video.title ?? undefined,
          speakerName: video.speakerName ?? undefined,
          speakerPhoto: video.speakerPhoto ?? undefined,
          url: video.url ?? video.videoFileUrl ?? undefined,
          videoFileUrl: video.videoFileUrl ?? undefined,
          provider: video.provider ?? undefined,
          sortOrder: video.sortOrder ?? index,
          externalId: video.externalId ?? undefined,
        })),
    });
  }

  if (input.brochures?.length) {
    await prisma.propertyBrochure.createMany({
      data: input.brochures.map((b, index) => ({
        propertyId,
        title: b.title ?? undefined,
        url: b.url,
        sortOrder: b.sortOrder ?? index,
        externalId: b.externalId ?? undefined,
      })),
    });
  }

  if (input.documents?.length) {
    await prisma.propertyDocument.createMany({
      data: input.documents.map((doc, index) => ({
        propertyId,
        title: doc.title,
        kind: "OTHER",
        url: doc.url ?? undefined,
        description: doc.description ?? undefined,
        sortOrder: doc.sortOrder ?? index,
        externalId: doc.externalId ?? undefined,
      })),
    });
  }

  await prisma.paymentPlan.deleteMany({ where: { propertyId } });
  if (input.paymentPlans?.length) {
    for (const [index, plan] of input.paymentPlans.entries()) {
      await prisma.paymentPlan.create({
        data: {
          propertyId,
          externalId: plan.externalId ?? undefined,
          title: plan.title,
          durationMonths: plan.durationMonths ?? undefined,
          isHandover: plan.isHandover ?? false,
          monthsAfterHandover: plan.monthsAfterHandover ?? undefined,
          eoi: plan.eoi ?? undefined,
          sortOrder: index,
          steps: plan.steps?.length
            ? {
                create: plan.steps.map((step, stepIndex) => ({
                  name: step.name,
                  percent: step.percent ?? undefined,
                  amount: step.amount ?? undefined,
                  dueLabel: step.dueLabel ?? undefined,
                  sortOrder: step.sortOrder ?? stepIndex,
                })),
              }
            : undefined,
        },
      });
    }
  }

  if (input.address) {
    await prisma.propertyAddress.upsert({
      where: { propertyId },
      create: {
        propertyId,
        country: input.address.country ?? undefined,
        state: input.address.state ?? undefined,
        city: input.address.city ?? undefined,
        district: input.address.district ?? undefined,
        locality: input.address.locality ?? undefined,
        subLocality: input.address.subLocality ?? undefined,
        community: input.address.community ?? undefined,
        subCommunity: input.address.subCommunity ?? undefined,
        tower: input.address.tower ?? undefined,
        latitude: input.address.latitude ?? undefined,
        longitude: input.address.longitude ?? undefined,
        googlePlaceId: input.address.googlePlaceId ?? undefined,
        mapLocation: input.address.mapLocation ?? undefined,
        externalLocationId: input.address.externalLocationId ?? undefined,
      },
      update: {
        country: input.address.country ?? undefined,
        state: input.address.state ?? undefined,
        city: input.address.city ?? undefined,
        district: input.address.district ?? undefined,
        locality: input.address.locality ?? undefined,
        subLocality: input.address.subLocality ?? undefined,
        community: input.address.community ?? undefined,
        subCommunity: input.address.subCommunity ?? undefined,
        tower: input.address.tower ?? undefined,
        latitude: input.address.latitude ?? undefined,
        longitude: input.address.longitude ?? undefined,
        googlePlaceId: input.address.googlePlaceId ?? undefined,
        mapLocation: input.address.mapLocation ?? undefined,
        externalLocationId: input.address.externalLocationId ?? undefined,
      },
    });
  }

  if (input.unitTypes && input.unitTypes.length > 0) {
    await prisma.propertyUnitType.deleteMany({ where: { propertyId } });
    await prisma.propertyUnitType.createMany({
      data: input.unitTypes.map((unit, index) => ({
        propertyId,
        externalId: unit.externalId ?? undefined,
        name: unit.name ?? undefined,
        unitType: unit.unitType ?? undefined,
        normalizedType: unit.normalizedType ?? undefined,
        bedroomsLabel: unit.bedroomsLabel ?? undefined,
        bedrooms: unit.bedrooms != null ? unit.bedrooms : undefined,
        unitsAmount: unit.unitsAmount ?? undefined,
        areaFrom: unit.areaFrom ?? undefined,
        areaTo: unit.areaTo ?? undefined,
        priceFrom: unit.priceFrom ?? undefined,
        priceTo: unit.priceTo ?? undefined,
        priceFromAed: unit.priceFromAed ?? undefined,
        priceToAed: unit.priceToAed ?? undefined,
        priceFromUsd: unit.priceFromUsd ?? undefined,
        priceToUsd: unit.priceToUsd ?? undefined,
        sizeFromSqft: unit.sizeFromSqft ?? undefined,
        sizeToSqft: unit.sizeToSqft ?? undefined,
        sizeFromM2: unit.sizeFromM2 ?? undefined,
        sizeToM2: unit.sizeToM2 ?? undefined,
        areaUnit: unit.areaUnit ?? undefined,
        priceCurrency: unit.priceCurrency ?? undefined,
        typicalImageUrl: unit.typicalImageUrl ?? undefined,
        sortOrder: index,
      })),
    });
  }

  if (input.seo) {
    const seo = input.seo;
    const hasSeo = Boolean(
      seo.metaTitle ||
        seo.metaDescription ||
        seo.canonicalUrl ||
        seo.ogTitle ||
        seo.ogDescription ||
        seo.twitterTitle ||
        seo.twitterDescription ||
        seo.keywords,
    );
    if (hasSeo) {
      await prisma.propertySeo.upsert({
        where: { propertyId },
        create: {
          propertyId,
          metaTitle: seo.metaTitle ?? undefined,
          metaDescription: seo.metaDescription ?? undefined,
          canonicalUrl: seo.canonicalUrl ?? undefined,
          ogTitle: seo.ogTitle ?? undefined,
          ogDescription: seo.ogDescription ?? undefined,
          twitterTitle: seo.twitterTitle ?? undefined,
          twitterDescription: seo.twitterDescription ?? undefined,
          schemaJson: seo.keywords
            ? ({ keywords: seo.keywords } as Prisma.InputJsonValue)
            : undefined,
        },
        update: {
          metaTitle: seo.metaTitle ?? undefined,
          metaDescription: seo.metaDescription ?? undefined,
          canonicalUrl: seo.canonicalUrl ?? undefined,
          ogTitle: seo.ogTitle ?? undefined,
          ogDescription: seo.ogDescription ?? undefined,
          twitterTitle: seo.twitterTitle ?? undefined,
          twitterDescription: seo.twitterDescription ?? undefined,
          schemaJson: seo.keywords
            ? ({ keywords: seo.keywords } as Prisma.InputJsonValue)
            : undefined,
        },
      });
    }
  }
}

export type PropertyListFilters = {
  organizationId: string;
  source?: "LEADRAT" | "MANUAL";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "EXPIRED";
  featured?: boolean;
  q?: string;
  developerId?: string;
  /** Listings owned by one consultant, e.g. their public profile page. */
  agentId?: string;
  cityId?: string;
  areaId?: string;
  saleStatus?: string;
  constructionStatus?: string;
  completionLabel?: string;
  /** Public filter: off-plan vs ready inventory */
  completionMode?: "off-plan" | "ready";
  propertyTypeId?: string;
  /** Property type name match when id not used */
  propertyTypeName?: string;
  beds?: string;
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  /** AED per sqft, compared as minPrice / minSize. */
  priceSqftMin?: number;
  priceSqftMax?: number;
  furnishing?:
    | "FURNISHED"
    | "UNFURNISHED"
    | "SEMI_FURNISHED"
    | "PARTLY"
    | "ANY";
  amenity?: string;
  payments?: string;
  /** Minimum broker cashback percentage, e.g. 1 matches 1% and above. */
  cashbackMin?: number;
  /** Any tour when true, or a specific tour type. */
  virtualTour?: "any" | VirtualTourType;
  /** Public listings only: hide records the upstream feed left without media. */
  requireMedia?: boolean;
  sort?: PropertySort;
  page?: number;
  pageSize?: number;
};

export type PropertySort =
  | "price-asc"
  | "price-desc"
  | "newest"
  | "handover";

const SORT_ORDER_BY: Record<PropertySort, Prisma.PropertyOrderByWithRelationInput[]> = {
  // nulls: "last" keeps price-less records from hijacking the first page.
  "price-asc": [{ minPrice: { sort: "asc", nulls: "last" } }, { name: "asc" }],
  "price-desc": [{ minPrice: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  newest: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  handover: [
    { possessionDate: { sort: "asc", nulls: "last" } },
    { completionLabel: "asc" },
  ],
};

const DEFAULT_ORDER_BY: Prisma.PropertyOrderByWithRelationInput[] = [
  { listPriority: "asc" },
  { images: { _count: "desc" } },
  { updatedAt: "desc" },
];

async function idsMatchingPriceSqft(input: {
  organizationId: string;
  priceSqftMin?: number;
  priceSqftMax?: number;
  status?: PropertyListFilters["status"];
}) {
  if (input.priceSqftMin == null && input.priceSqftMax == null) {
    return undefined;
  }

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM properties
    WHERE "organizationId" = ${input.organizationId}
      AND "deletedAt" IS NULL
      ${input.status ? Prisma.sql`AND status = ${input.status}::"PropertyStatus"` : Prisma.empty}
      AND "minPrice" IS NOT NULL
      AND "minSize" IS NOT NULL
      AND "minSize" > 0
      ${
        input.priceSqftMin != null
          ? Prisma.sql`AND ("minPrice" / NULLIF("minSize", 0)) >= ${input.priceSqftMin}`
          : Prisma.empty
      }
      ${
        input.priceSqftMax != null
          ? Prisma.sql`AND ("minPrice" / NULLIF("minSize", 0)) <= ${input.priceSqftMax}`
          : Prisma.empty
      }
  `;

  return rows.map((row) => row.id);
}

export const propertyRepository = {
  async listAdmin(filters: PropertyListFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24));
    const priceSqftIds = await idsMatchingPriceSqft({
      organizationId: filters.organizationId,
      priceSqftMin: filters.priceSqftMin,
      priceSqftMax: filters.priceSqftMax,
      status: filters.status,
    });
    const bedFilter = (() => {
      if (!filters.beds) return undefined;
      if (filters.beds === "studio") {
        return {
          unitTypes: {
            some: {
              deletedAt: null,
              OR: [{ bedrooms: 0 }, { bedroomsLabel: { contains: "studio", mode: "insensitive" as const } }],
            },
          },
        };
      }
      if (filters.beds === "5+") {
        return {
          unitTypes: {
            some: { deletedAt: null, bedrooms: { gte: 5 } },
          },
        };
      }
      const n = Number(filters.beds);
      if (!Number.isFinite(n)) return undefined;
      return {
        unitTypes: {
          some: { deletedAt: null, bedrooms: n },
        },
      };
    })();

    const andFilters: Prisma.PropertyWhereInput[] = [];

    if (filters.completionMode === "ready") {
      andFilters.push({
        OR: [
          { completionStatus: "READY" },
          {
            constructionStatus: {
              contains: "ready",
              mode: "insensitive",
            },
          },
          {
            constructionStatus: {
              contains: "completed",
              mode: "insensitive",
            },
          },
        ],
      });
    } else if (filters.completionMode === "off-plan") {
      // LeadRat off-plan inventory often has null completionStatus and
      // "Unknown" constructionStatus — treat those as off-plan, exclude ready.
      andFilters.push({
        AND: [
          {
            NOT: {
              OR: [
                { completionStatus: "READY" },
                {
                  constructionStatus: {
                    contains: "ready",
                    mode: "insensitive",
                  },
                },
                {
                  constructionStatus: {
                    contains: "completed",
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
          {
            OR: [
              { completionStatus: "OFF_PLAN" },
              { completionStatus: "UNDER_CONSTRUCTION" },
              { completionStatus: null },
              {
                constructionStatus: {
                  contains: "off",
                  mode: "insensitive",
                },
              },
              {
                constructionStatus: {
                  contains: "under",
                  mode: "insensitive",
                },
              },
              {
                constructionStatus: {
                  equals: "Unknown",
                  mode: "insensitive",
                },
              },
              { source: "LEADRAT" },
            ],
          },
        ],
      });
    }

    if (filters.q) {
      andFilters.push({
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { slug: { contains: filters.q, mode: "insensitive" } },
          {
            leadratProjectId: {
              contains: filters.q,
              mode: "insensitive",
            },
          },
          {
            developer: {
              name: { contains: filters.q, mode: "insensitive" },
            },
          },
          {
            area: { name: { contains: filters.q, mode: "insensitive" } },
          },
          {
            community: {
              name: { contains: filters.q, mode: "insensitive" },
            },
          },
          {
            city: { name: { contains: filters.q, mode: "insensitive" } },
          },
        ],
      });
    }

    if (priceSqftIds) {
      andFilters.push({ id: { in: priceSqftIds } });
    }

    if (filters.sizeMin != null || filters.sizeMax != null) {
      if (filters.sizeMin != null) {
        andFilters.push({
          OR: [
            { maxSize: { gte: filters.sizeMin } },
            {
              AND: [{ maxSize: null }, { minSize: { gte: filters.sizeMin } }],
            },
          ],
        });
      }
      if (filters.sizeMax != null) {
        andFilters.push({
          OR: [
            { minSize: { lte: filters.sizeMax } },
            {
              AND: [{ minSize: null }, { maxSize: { lte: filters.sizeMax } }],
            },
          ],
        });
      }
    }

    const where: Prisma.PropertyWhereInput = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.featured != null ? { isFeatured: filters.featured } : {}),
      ...(filters.developerId ? { developerId: filters.developerId } : {}),
      ...(filters.agentId ? { agentId: filters.agentId } : {}),
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.areaId ? { areaId: filters.areaId } : {}),
      ...(filters.propertyTypeId
        ? { propertyTypeId: filters.propertyTypeId }
        : filters.propertyTypeName
          ? {
              propertyType: {
                name: {
                  equals: filters.propertyTypeName,
                  mode: "insensitive",
                },
              },
            }
          : {}),
      ...(filters.saleStatus
        ? { saleStatus: { contains: filters.saleStatus, mode: "insensitive" } }
        : {}),
      ...(filters.constructionStatus
        ? {
            constructionStatus: {
              contains: filters.constructionStatus,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.completionLabel
        ? {
            completionLabel: {
              equals: filters.completionLabel,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.priceMin != null || filters.priceMax != null
        ? {
            minPrice: {
              ...(filters.priceMin != null ? { gte: filters.priceMin } : {}),
              ...(filters.priceMax != null ? { lte: filters.priceMax } : {}),
            },
          }
        : {}),
      ...(filters.furnishing && filters.furnishing !== "ANY"
        ? filters.furnishing === "PARTLY" ||
          filters.furnishing === "SEMI_FURNISHED"
          ? {
              furnishing: {
                in: [
                  "SEMI_FURNISHED",
                  "ONLY_KITCHEN",
                  "OPTIONAL_FURNISHED",
                ],
              },
            }
          : filters.furnishing === "FURNISHED"
            ? { furnishing: { in: ["FURNISHED", "YES"] } }
            : filters.furnishing === "UNFURNISHED"
              ? { furnishing: { in: ["UNFURNISHED", "NO"] } }
              : {}
        : {}),
      ...(filters.amenity
        ? {
            amenities: {
              some: {
                deletedAt: null,
                amenity: {
                  name: {
                    contains: filters.amenity,
                    mode: "insensitive",
                  },
                },
              },
            },
          }
        : {}),
      ...(filters.payments
        ? {
            depositDescription: {
              contains: filters.payments,
              mode: "insensitive",
            },
          }
        : {}),
      ...(filters.cashbackMin != null
        ? { cashbackPercent: { gte: new Prisma.Decimal(filters.cashbackMin) } }
        : {}),
      ...(filters.virtualTour
        ? filters.virtualTour === "any"
          ? { virtualTour: { not: null } }
          : { virtualTour: filters.virtualTour }
        : {}),
      ...(filters.requireMedia
        ? { images: { some: { deletedAt: null } } }
        : {}),
      ...bedFilter,
      ...(andFilters.length ? { AND: andFilters } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy: filters.sort
          ? SORT_ORDER_BY[filters.sort]
          : DEFAULT_ORDER_BY,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          developer: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          area: { select: { id: true, name: true, slug: true } },
          community: { select: { id: true, name: true, slug: true } },
          city: { select: { id: true, name: true } },
          propertyType: { select: { id: true, name: true } },
          sync: {
            select: {
              status: true,
              lastSyncedAt: true,
              importedAt: true,
              lastError: true,
            },
          },
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { id: true, url: true, alt: true, isCover: true },
          },
          paymentPlans: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: {
              id: true,
              title: true,
              steps: {
                where: { deletedAt: null },
                orderBy: { sortOrder: "asc" },
                take: 4,
                select: { name: true, percent: true },
              },
            },
          },
          unitTypes: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            take: 30,
            select: {
              bedrooms: true,
              bedroomsLabel: true,
            },
          },
          _count: {
            select: {
              amenities: true,
              images: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async listSimilar(input: {
    organizationId: string;
    excludeId: string;
    areaId?: string | null;
    communityId?: string | null;
    developerId?: string | null;
    propertyTypeId?: string | null;
    take: number;
  }) {
    const base: Prisma.PropertyWhereInput = {
      organizationId: input.organizationId,
      status: "PUBLISHED",
      deletedAt: null,
      id: { not: input.excludeId },
    };

    const include = {
      developer: { select: { id: true, name: true, slug: true, logoUrl: true } },
      area: { select: { id: true, name: true, slug: true } },
      community: { select: { id: true, name: true, slug: true } },
      city: { select: { id: true, name: true } },
      propertyType: { select: { id: true, name: true } },
      images: {
        where: { deletedAt: null },
        orderBy: [{ isCover: "desc" as const }, { sortOrder: "asc" as const }],
        take: 1,
        select: { id: true, url: true, alt: true, isCover: true },
      },
      unitTypes: {
        where: { deletedAt: null },
        take: 30,
        select: { bedrooms: true, bedroomsLabel: true },
      },
    };

    // Widen the net until there are enough cards to fill the row.
    const tiers: Prisma.PropertyWhereInput[] = [
      ...(input.communityId ? [{ communityId: input.communityId }] : []),
      ...(input.areaId ? [{ areaId: input.areaId }] : []),
      ...(input.developerId ? [{ developerId: input.developerId }] : []),
      ...(input.propertyTypeId
        ? [{ propertyTypeId: input.propertyTypeId }]
        : []),
      {},
    ];

    const collected = new Map<
      string,
      Prisma.PropertyGetPayload<{ include: typeof include }>
    >();

    for (const tier of tiers) {
      if (collected.size >= input.take) break;
      const rows = await prisma.property.findMany({
        where: {
          ...base,
          ...tier,
          ...(collected.size
            ? { id: { notIn: [input.excludeId, ...collected.keys()] } }
            : {}),
        },
        include,
        orderBy: [{ listPriority: "asc" }, { updatedAt: "desc" }],
        take: input.take - collected.size,
      });
      for (const row of rows) collected.set(row.id, row);
    }

    return [...collected.values()].slice(0, input.take);
  },

  async listOffPlanFacets(organizationId: string) {
    const base = {
      organizationId,
      source: "LEADRAT" as const,
      deletedAt: null,
    };

    const [
      cities,
      areas,
      developers,
      types,
      saleRows,
      constructionRows,
      handoverRows,
    ] = await Promise.all([
      prisma.city.findMany({
        where: {
          organizationId,
          deletedAt: null,
          properties: { some: base },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.area.findMany({
        where: {
          organizationId,
          deletedAt: null,
          properties: { some: base },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.developer.findMany({
        where: {
          organizationId,
          deletedAt: null,
          properties: { some: base },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.propertyType.findMany({
        where: {
          organizationId,
          deletedAt: null,
          properties: { some: base },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.property.findMany({
        where: { ...base, saleStatus: { not: null } },
        select: { saleStatus: true },
        distinct: ["saleStatus"],
        orderBy: { saleStatus: "asc" },
      }),
      prisma.property.findMany({
        where: { ...base, constructionStatus: { not: null } },
        select: { constructionStatus: true },
        distinct: ["constructionStatus"],
        orderBy: { constructionStatus: "asc" },
      }),
      prisma.property.findMany({
        where: { ...base, completionLabel: { not: null } },
        select: { completionLabel: true },
        distinct: ["completionLabel"],
        orderBy: { completionLabel: "asc" },
      }),
    ]);

    return {
      regions: cities.map((c) => ({ value: c.id, label: c.name })),
      districts: areas.map((a) => ({ value: a.id, label: a.name })),
      developers: developers.map((d) => ({ value: d.id, label: d.name })),
      types: types.map((t) => ({ value: t.id, label: t.name })),
      beds: [],
      prices: [],
      payments: [],
      sales: saleRows
        .map((r) => r.saleStatus)
        .filter((v): v is string => Boolean(v))
        .map((v) => ({ value: v, label: v })),
      constructions: constructionRows
        .map((r) => r.constructionStatus)
        .filter((v): v is string => Boolean(v))
        .map((v) => ({ value: v, label: v })),
      handovers: handoverRows
        .map((r) => r.completionLabel)
        .filter((v): v is string => Boolean(v))
        .map((v) => ({ value: v, label: v })),
    };
  },

  async findByIdForAdmin(organizationId: string, id: string) {
    return prisma.property.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        developer: true,
        agent: true,
        area: true,
        community: true,
        city: true,
        country: true,
        propertyType: true,
        address: true,
        sync: true,
        seo: true,
        analytics: true,
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 24,
        },
        videos: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        brochures: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
        amenities: {
          where: { deletedAt: null },
          include: { amenity: true },
        },
        banks: {
          where: { deletedAt: null },
          include: { bank: true },
        },
        syncLogs: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  },

  async findPublishedBySlug(organizationId: string, slug: string) {
    return prisma.property.findFirst({
      where: {
        organizationId,
        slug,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            website: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            slug: true,
            title: true,
            phone: true,
            whatsapp: true,
            email: true,
            photoUrl: true,
            bio: true,
            reraNumber: true,
            yearsExperience: true,
            languages: true,
            specialties: true,
            isActive: true,
          },
        },
        area: { select: { id: true, name: true, slug: true } },
        community: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
        country: { select: { id: true, name: true } },
        propertyType: { select: { id: true, name: true, slug: true } },
        address: true,
        seo: true,
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 24,
        },
        videos: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        brochures: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
        amenities: {
          where: { deletedAt: null },
          include: { amenity: { select: { id: true, name: true, icon: true } } },
          take: 40,
        },
        paymentPlans: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          take: 3,
          include: {
            steps: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        unitTypes: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          take: 20,
        },
      },
    });
  },

  async listPublished(filters: Omit<PropertyListFilters, "status">) {
    return this.listAdmin({ ...filters, status: "PUBLISHED" });
  },

  async listPublishedFacets(organizationId: string) {
    const base = {
      organizationId,
      status: "PUBLISHED" as const,
      deletedAt: null,
    };

    const [types, amenities] = await Promise.all([
      prisma.propertyType.findMany({
        where: {
          organizationId,
          deletedAt: null,
          properties: { some: base },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
        take: 40,
      }),
      prisma.amenity.findMany({
        where: {
          organizationId,
          deletedAt: null,
          propertyAmenities: {
            some: { deletedAt: null, property: base },
          },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
        take: 24,
      }),
    ]);

    return {
      types: types.map((t) => ({ value: t.name, label: t.name })),
      amenities: amenities.map((a) => ({ value: a.name, label: a.name })),
    };
  },

  async findByLeadRatId(organizationId: string, leadratProjectId: string) {
    return prisma.property.findFirst({
      where: {
        organizationId,
        source: "LEADRAT",
        leadratProjectId,
        deletedAt: null,
      },
      include: { sync: true },
    });
  },

  async listLeadRatExternalIds(organizationId: string) {
    const rows = await prisma.property.findMany({
      where: {
        organizationId,
        source: "LEADRAT",
        deletedAt: null,
        leadratProjectId: { not: null },
      },
      select: { id: true, leadratProjectId: true },
    });
    return rows.filter((r) => r.leadratProjectId) as Array<{
      id: string;
      leadratProjectId: string;
    }>;
  },

  async upsertFromCanonical(organizationId: string, input: CanonicalProperty) {
    const contentHash = hashCanonicalProperty(input);
    let existing = input.leadratProjectId
      ? await this.findByLeadRatId(organizationId, input.leadratProjectId)
      : null;

    if (!existing && input.slug) {
      existing = await prisma.property.findFirst({
        where: {
          organizationId,
          slug: input.slug,
          deletedAt: null,
          ...(input.source === "MANUAL" ? { source: "MANUAL" as const } : {}),
        },
        include: { sync: true },
      });
    }

    if (existing?.sync?.contentHash === contentHash) {
      return { property: existing, action: "skipped" as const, contentHash };
    }

    const [developer, geo, propertyTypeId, categoryId] = await Promise.all([
      upsertDeveloper(organizationId, input.developer),
      upsertGeo(organizationId, input),
      upsertPropertyType(organizationId, input.propertyType),
      upsertCategory(organizationId, input.category),
    ]);

    const slug = await uniqueSlug(
      organizationId,
      input.slug || input.name,
      existing?.id,
    );

    const manualStatus =
      input.source === "MANUAL" && input.status ? input.status : undefined;

    const core = {
      name: input.name,
      slug,
      description: input.description ?? undefined,
      shortDescription: input.shortDescription ?? undefined,
      source: input.source === "MANUAL" ? ("MANUAL" as const) : ("LEADRAT" as const),
      leadratProjectId:
        input.source === "MANUAL"
          ? undefined
          : (input.leadratProjectId ?? undefined),
      reellyProjectId: input.reellyProjectId ?? undefined,
      reellySlug: input.reellySlug ?? undefined,
      constructionStatus: input.constructionStatus ?? undefined,
      saleStatus: input.saleStatus ?? undefined,
      completionStatus: deriveCompletionStatus(input.constructionStatus),
      completionLabel: input.completionLabel ?? undefined,
      possessionDate: toValidDate(input.possessionDate),
      constructionStartDate: toValidDate(input.constructionStartDate),
      constructionEndDate: toValidDate(input.constructionEndDate),
      developerId: developer?.id ?? undefined,
      communityId: geo.communityId ?? undefined,
      areaId: geo.areaId ?? undefined,
      cityId: geo.cityId ?? undefined,
      countryId: geo.countryId ?? undefined,
      propertyTypeId: propertyTypeId ?? undefined,
      categoryId: categoryId ?? undefined,
      minPrice: dec(input.minPrice),
      maxPrice: dec(input.maxPrice),
      currency: input.currency || "AED",
      minSize: dec(input.minSize),
      maxSize: dec(input.maxSize),
      areaUnit: input.areaUnit ?? "sqft",
      serviceCharge: input.serviceCharge ?? undefined,
      depositDescription: input.depositDescription ?? undefined,
      buildingCount: input.buildingCount ?? undefined,
      unitsCount: input.unitsCount ?? undefined,
      isFeatured: input.isFeatured ?? false,
      isVerified: input.isVerified ?? false,
      isPartnerProject: input.isPartnerProject ?? false,
      listPriority: computeListPriority(
        input.name,
        developer?.name ?? input.developer?.name,
        developer?.listPriority,
      ),
      details:
        input.details != null
          ? (input.details as Prisma.InputJsonValue)
          : undefined,
      status: (manualStatus ?? "PUBLISHED") as
        | "DRAFT"
        | "PUBLISHED"
        | "ARCHIVED"
        | "EXPIRED",
    };

    const property = existing
      ? await prisma.property.update({
          where: { id: existing.id },
          data: {
            ...core,
            // Keep local publish state on LeadRat sync; allow manual status updates
            status:
              input.source === "MANUAL" && manualStatus
                ? manualStatus
                : existing.status,
            isFeatured:
              input.source === "MANUAL"
                ? (input.isFeatured ?? existing.isFeatured)
                : existing.isFeatured,
          },
        })
      : await prisma.property.create({
          data: {
            organizationId,
            ...core,
            publishedAt:
              core.status === "PUBLISHED" ? new Date() : undefined,
          },
        });

    await replaceChildren(property.id, input);
    await syncAmenities(organizationId, property.id, input.amenities);
    await syncBanks(organizationId, property.id, input.banks);

    await prisma.propertyAnalytics.upsert({
      where: { propertyId: property.id },
      create: { propertyId: property.id },
      update: {},
    });

    const now = new Date();
    await prisma.propertySync.upsert({
      where: { propertyId: property.id },
      create: {
        propertyId: property.id,
        status: "SYNCED",
        apiVersion:
          input.source === "MANUAL" ? "manual-upload" : "offplan-public",
        syncVersion: 1,
        contentHash,
        importedAt: now,
        lastSyncedAt: now,
        lastError: null,
        lastPayload: input.raw as Prisma.InputJsonValue,
        providerUpdatedAt: input.providerUpdatedAt
          ? new Date(input.providerUpdatedAt)
          : null,
      },
      update: {
        status: "SYNCED",
        syncVersion: { increment: 1 },
        contentHash,
        lastSyncedAt: now,
        lastError: null,
        lastPayload: input.raw as Prisma.InputJsonValue,
        providerUpdatedAt: input.providerUpdatedAt
          ? new Date(input.providerUpdatedAt)
          : null,
        importedAt: existing?.sync?.importedAt ?? now,
      },
    });

    return {
      property,
      action: existing ? ("updated" as const) : ("imported" as const),
      contentHash,
    };
  },

  async createManual(
    organizationId: string,
    input: {
      name: string;
      shortDescription?: string | null;
      description?: string | null;
      minPrice?: number | null;
      currency?: string;
      developerId?: string | null;
      areaId?: string | null;
      communityId?: string | null;
      cityId?: string | null;
      saleStatus?: string | null;
      completionLabel?: string | null;
    },
  ) {
    const slug = await uniqueSlug(organizationId, input.name);
    const developer = input.developerId
      ? await prisma.developer.findFirst({
          where: { id: input.developerId, deletedAt: null },
          select: { name: true, listPriority: true },
        })
      : null;
    return prisma.property.create({
      data: {
        organizationId,
        name: input.name.trim(),
        slug,
        shortDescription: input.shortDescription ?? undefined,
        description: input.description ?? undefined,
        source: "MANUAL",
        status: "PUBLISHED",
        publishedAt: new Date(),
        currency: input.currency || "AED",
        minPrice: input.minPrice != null ? dec(input.minPrice) : undefined,
        developerId: input.developerId ?? undefined,
        areaId: input.areaId ?? undefined,
        communityId: input.communityId ?? undefined,
        cityId: input.cityId ?? undefined,
        saleStatus: input.saleStatus ?? undefined,
        completionLabel: input.completionLabel ?? undefined,
        listPriority: computeListPriority(
          input.name,
          developer?.name,
          developer?.listPriority,
        ),
        analytics: { create: {} },
      },
    });
  },

  async patchManualRelations(
    organizationId: string,
    propertyId: string,
    input: {
      developerId?: string | null;
      agentId?: string | null;
      cityId?: string | null;
      areaId?: string | null;
      communityId?: string | null;
      categoryId?: string | null;
      propertyTypeId?: string | null;
    },
  ) {
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, organizationId, deletedAt: null },
      select: { id: true, name: true, developerId: true },
    });
    if (!existing) return null;

    const nextDeveloperId =
      input.developerId !== undefined
        ? input.developerId || null
        : existing.developerId;
    const developer = nextDeveloperId
      ? await prisma.developer.findFirst({
          where: { id: nextDeveloperId, deletedAt: null },
          select: { name: true, listPriority: true },
        })
      : null;

    return prisma.property.update({
      where: { id: propertyId },
      data: {
        ...(input.developerId !== undefined
          ? { developerId: input.developerId || null }
          : {}),
        ...(input.agentId !== undefined
          ? { agentId: input.agentId || null }
          : {}),
        ...(input.cityId ? { cityId: input.cityId } : {}),
        ...(input.areaId ? { areaId: input.areaId } : {}),
        ...(input.communityId ? { communityId: input.communityId } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.propertyTypeId
          ? { propertyTypeId: input.propertyTypeId }
          : {}),
        ...(input.developerId !== undefined
          ? {
              listPriority: computeListPriority(
                existing.name,
                developer?.name,
                developer?.listPriority,
              ),
            }
          : {}),
      },
    });
  },

  /** One of an agent's own portal listings, for ownership checks. */
  async findOwnedByAgent(
    organizationId: string,
    agentId: string,
    propertyId: string,
  ) {
    return prisma.property.findFirst({
      where: { id: propertyId, organizationId, agentId, deletedAt: null },
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          select: { url: true, isCover: true },
        },
        amenities: {
          where: { deletedAt: null },
          select: { amenity: { select: { name: true } } },
        },
        developer: { select: { name: true } },
        propertyType: { select: { name: true } },
        category: { select: { name: true } },
        city: { select: { name: true } },
        area: { select: { name: true } },
        community: { select: { name: true } },
        address: true,
      },
    });
  },

  async listByAgent(
    organizationId: string,
    agentId: string,
    { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
  ) {
    const where: Prisma.PropertyWhereInput = {
      organizationId,
      agentId,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          workflowState: true,
          minPrice: true,
          currency: true,
          updatedAt: true,
          city: { select: { name: true } },
          area: { select: { name: true } },
          _count: { select: { images: { where: { deletedAt: null } } } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  /** Review transitions for portal listings. */
  async setPortalWorkflow(
    organizationId: string,
    propertyId: string,
    data: {
      workflowState: WorkflowState;
      status?: PropertyStatus;
      publish?: boolean;
    },
  ) {
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, organizationId, deletedAt: null },
      select: { id: true, publishedAt: true },
    });
    if (!existing) return null;

    return prisma.property.update({
      where: { id: existing.id },
      data: {
        workflowState: data.workflowState,
        ...(data.status ? { status: data.status } : {}),
        ...(data.publish
          ? { publishedAt: existing.publishedAt ?? new Date() }
          : {}),
      },
    });
  },

  async assignAgent(
    organizationId: string,
    propertyId: string,
    agentId: string | null,
  ) {
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    if (agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, organizationId, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!agent) return null;
    }

    return prisma.property.update({
      where: { id: propertyId },
      data: { agentId },
      include: { agent: true },
    });
  },

  async setPublishStatus(
    organizationId: string,
    propertyId: string,
    status: "DRAFT" | "PUBLISHED",
  ) {
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, organizationId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing) return null;

    return prisma.property.update({
      where: { id: propertyId },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        name: true,
      },
    });
  },

  /**
   * Marketing fields set by hand in admin. They are deliberately not touched by
   * the LeadRat sync, which has no equivalent upstream data.
   */
  async setMarketingOffers(
    organizationId: string,
    propertyId: string,
    offers: {
      cashbackPercent: number | null;
      virtualTour: VirtualTourType | null;
    },
  ) {
    const existing = await prisma.property.findFirst({
      where: { id: propertyId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.property.update({
      where: { id: propertyId },
      data: {
        cashbackPercent:
          offers.cashbackPercent == null
            ? null
            : new Prisma.Decimal(offers.cashbackPercent),
        virtualTour: offers.virtualTour,
      },
      select: { id: true, cashbackPercent: true, virtualTour: true },
    });
  },

  async markProviderDeleted(propertyId: string) {
    return prisma.propertySync.upsert({
      where: { propertyId },
      create: {
        propertyId,
        status: "PROVIDER_DELETED",
        apiVersion: "leadrat-v1",
        lastSyncedAt: new Date(),
        lastError: "Project no longer returned by LeadRat",
      },
      update: {
        status: "PROVIDER_DELETED",
        lastSyncedAt: new Date(),
        lastError: "Project no longer returned by LeadRat",
      },
    });
  },

  async addSyncLog(input: {
    propertyId: string;
    status: "SYNCED" | "FAILED" | "SYNCING" | "PENDING" | "STALE" | "PROVIDER_DELETED" | "IDLE" | "NOT_REQUIRED";
    error?: string | null;
    request?: unknown;
    response?: unknown;
    durationMs?: number;
    attempt?: number;
  }) {
    return prisma.propertySyncLog.create({
      data: {
        propertyId: input.propertyId,
        status: input.status,
        apiVersion: "leadrat-v1",
        attempt: input.attempt ?? 1,
        error: input.error ?? undefined,
        request: input.request as Prisma.InputJsonValue | undefined,
        response: input.response as Prisma.InputJsonValue | undefined,
        durationMs: input.durationMs,
      },
    });
  },

  async getSyncOverview(organizationId: string) {
    const [total, synced, failed, stale, deleted, recentLogs] =
      await Promise.all([
        prisma.property.count({
          where: { organizationId, source: "LEADRAT", deletedAt: null },
        }),
        prisma.propertySync.count({
          where: {
            status: "SYNCED",
            deletedAt: null,
            property: { organizationId, source: "LEADRAT", deletedAt: null },
          },
        }),
        prisma.propertySync.count({
          where: {
            status: "FAILED",
            deletedAt: null,
            property: { organizationId, source: "LEADRAT", deletedAt: null },
          },
        }),
        prisma.propertySync.count({
          where: {
            status: "STALE",
            deletedAt: null,
            property: { organizationId, source: "LEADRAT", deletedAt: null },
          },
        }),
        prisma.propertySync.count({
          where: {
            status: "PROVIDER_DELETED",
            deletedAt: null,
            property: { organizationId, source: "LEADRAT", deletedAt: null },
          },
        }),
        prisma.propertySyncLog.findMany({
          where: {
            deletedAt: null,
            property: { organizationId, source: "LEADRAT" },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            property: { select: { id: true, name: true, leadratProjectId: true } },
          },
        }),
      ]);

    return { total, synced, failed, stale, deleted, recentLogs };
  },
};
