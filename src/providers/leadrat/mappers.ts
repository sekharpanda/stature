import { createHash } from "crypto";

import type {
  CanonicalPaymentPlan,
  CanonicalProperty,
  GalleryKind,
} from "@/providers/property/types";
import { slugify } from "@/lib/utils";
import { getLeadRatConfig } from "./config";
import type { LeadRatGalleryItem, LeadRatProject } from "./client";

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^\d.-]/g, "").split(",")[0];
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseCoord(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // LeadRat samples sometimes look like "40.753, -73.983."
  const first = String(value).split(",")[0]?.trim().replace(/\.$/, "");
  const n = Number(first);
  return Number.isFinite(n) ? n : null;
}

function galleryKindFromKey(key: string): GalleryKind {
  const k = key.toLowerCase();
  if (k.includes("lobby")) return "LOBBY";
  if (k.includes("interior") || k.includes("inside")) return "INTERIOR";
  if (k.includes("architect") || k.includes("exterior") || k.includes("elevat"))
    return "ARCHITECTURE";
  if (k.includes("plan") || k.includes("master") || k.includes("general"))
    return "GENERAL_PLAN";
  if (k.includes("layout") || k.includes("unit")) return "UNIT_LAYOUT";
  if (k.includes("cover") || k.includes("hero")) return "COVER";
  return "OTHER";
}

/** Resolve LeadRat relative media paths to absolute URLs when possible. */
export function resolveLeadRatMediaUrl(
  raw: string | null | undefined,
  mediaBaseUrl = getLeadRatConfig().mediaBaseUrl,
): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const base = mediaBaseUrl.replace(/\/$/, "");
  const path = trimmed.replace(/^\//, "");
  return `${base}/${path}`;
}

function mediaUrl(item: LeadRatGalleryItem): string | null {
  return resolveLeadRatMediaUrl(item.url || item.imageFilePath);
}

function quarterLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Q${q} ${d.getUTCFullYear()}`;
}

function possessionLabel(project: LeadRatProject): string | null {
  const raw = project.possesionType ?? project.possessionType;
  if (raw && raw !== "None") {
    const map: Record<string, string> = {
      UnderConstruction: "Under construction",
      SixMonth: "In 6 months",
      Year: "In 1 year",
      TwoYears: "In 2 years",
      Immediate: "Immediate",
      CustomDate: "Custom date",
    };
    if (map[raw]) return map[raw];
  }
  return (
    quarterLabel(project.possessionDate) ??
    quarterLabel(project.endDate) ??
    null
  );
}

/** Parse "40/60%", "50/50", "Attractive 50/50" style ratios from description. */
function extractPaymentPlanRatio(text: string | null | undefined): string | null {
  if (!text) return null;
  const match = text.match(
    /(\d{1,2})\s*[\/:]\s*(\d{1,2})\s*%?(?:\s*(?:payment\s*plan|installment))?/i,
  );
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a + b !== 100) {
    // Still show common ratios even if they don't sum to 100 (e.g. 20/80)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  }
  return `${a}/${b}%`;
}

function extractDeveloperFromText(
  text: string | null | undefined,
): string | null {
  if (!text) return null;
  const byMatch = text.match(/\bby\s+([A-Z][A-Za-z0-9&.'\-\s]{2,60}?)(?:[.,\n]|$)/);
  if (byMatch?.[1]) return byMatch[1].trim().replace(/\s+/g, " ");
  return null;
}

function buildPaymentPlans(
  project: LeadRatProject,
): CanonicalPaymentPlan[] | undefined {
  const ratio = extractPaymentPlanRatio(project.description);
  if (!ratio) return undefined;
  const [pre, post] = ratio.replace("%", "").split("/").map(Number);
  return [
    {
      title: `${ratio} Payment Plan`,
      steps: [
        {
          name: "During construction",
          percent: pre,
          sortOrder: 0,
        },
        {
          name: "On handover",
          percent: post,
          sortOrder: 1,
        },
      ],
    },
  ];
}

function saleStatusLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const normalized = raw.trim();
  if (!normalized || normalized === "None") return null;
  const map: Record<string, string> = {
    Active: "On Sale",
    OnSale: "On Sale",
    Presale: "Presale",
    PreSale: "Presale",
    SoldOut: "Sold Out",
    ComingSoon: "Coming Soon",
  };
  return map[normalized] ?? normalized;
}

export function mapLeadRatProjectToCanonical(
  project: LeadRatProject,
): CanonicalProperty {
  const name = (project.name ?? "Untitled Project").trim();
  const currency =
    project.monetaryInfo?.Currency ??
    project.monetaryInfo?.currency ??
    "AED";

  const images: CanonicalProperty["images"] = [];
  const imageGroups = project.imageUrls ?? {};
  if (imageGroups && typeof imageGroups === "object") {
    let order = 0;
    for (const [key, items] of Object.entries(imageGroups)) {
      const list = (items ?? []) as LeadRatGalleryItem[];
      // Keys are often the relative path itself when gallery metadata is thin
      if (!list.length) {
        const fromKey = resolveLeadRatMediaUrl(key);
        if (fromKey && (key.includes("/") || key.includes("."))) {
          images.push({
            url: fromKey,
            galleryKind: "OTHER",
            caption: null,
            alt: name,
            sortOrder: order++,
            isCover: order === 1,
          });
        }
        continue;
      }
      const kind = galleryKindFromKey(key);
      for (const item of list) {
        const url =
          mediaUrl(item) ??
          resolveLeadRatMediaUrl(item.imageFilePath) ??
          resolveLeadRatMediaUrl(key.includes("/") ? key : null);
        if (!url) continue;
        images.push({
          url,
          galleryKind: item.isCoverImage ? "COVER" : kind,
          caption: item.name ?? null,
          alt: item.name ?? name,
          sortOrder: order++,
          isCover: Boolean(item.isCoverImage),
        });
      }
    }
  }

  if (!images.some((i) => i.isCover) && images[0]) {
    images[0].isCover = true;
    images[0].galleryKind = "COVER";
  }

  const videos: NonNullable<CanonicalProperty["videos"]> = [];
  for (const [index, item] of (project.videos ?? []).entries()) {
    const url = mediaUrl(item);
    if (!url) continue;
    videos.push({
      title: item.name ?? null,
      url,
      videoFileUrl: resolveLeadRatMediaUrl(item.imageFilePath),
      sortOrder: index,
    });
  }

  const brochures: NonNullable<CanonicalProperty["brochures"]> = [];
  for (const [index, item] of (project.brochures ?? []).entries()) {
    const url = resolveLeadRatMediaUrl(item.url);
    if (!url) continue;
    brochures.push({
      title: item.name ?? "Brochure",
      url,
      sortOrder: index,
    });
  }

  const documents: NonNullable<CanonicalProperty["documents"]> = [];
  for (const [index, item] of (project.documents ?? []).entries()) {
    if (!item.filePath && !item.documentName) continue;
    documents.push({
      title: item.documentName ?? "Document",
      kind: "OTHER",
      url: resolveLeadRatMediaUrl(item.filePath),
      externalId: item.id ?? null,
      sortOrder: index,
    });
  }

  const address = project.address
    ? {
        country: project.address.country ?? null,
        state: project.address.state ?? null,
        city: project.address.city ?? null,
        district: project.address.district ?? null,
        locality: project.address.locality ?? null,
        subLocality: project.address.subLocality ?? null,
        community: project.address.community ?? null,
        subCommunity: project.address.subCommunity ?? null,
        tower: project.address.towerName ?? null,
        latitude: parseCoord(project.address.latitude),
        longitude: parseCoord(project.address.longitude),
        googlePlaceId: project.address.placeId ?? null,
        mapLocation:
          project.address.isGoogleMapLocation && project.address.placeId
            ? `place:${project.address.placeId}`
            : null,
        externalLocationId: project.address.id ?? null,
      }
    : undefined;

  const typeName =
    project.projectType?.displayName ??
    project.projectType?.DisplayName ??
    project.projectType?.type ??
    project.projectType?.Type ??
    null;

  const developerName =
    project.builderDetails?.name?.trim() ||
    extractDeveloperFromText(project.description) ||
    extractDeveloperFromText(project.address?.subLocality) ||
    null;

  const paymentRatio = extractPaymentPlanRatio(project.description);
  const paymentPlans = buildPaymentPlans(project);
  const completionLabel = possessionLabel(project);

  return {
    source: "LEADRAT",
    leadratProjectId: project.id,
    name,
    slug: slugify(name),
    description: project.description ?? null,
    shortDescription: project.notes ?? null,
    constructionStatus: project.status ?? null,
    saleStatus: saleStatusLabel(project.currentStatus) ?? project.currentStatus ?? null,
    completionLabel,
    possessionDate: project.possessionDate ?? null,
    constructionStartDate: project.startDate ?? null,
    constructionEndDate: project.endDate ?? null,
    minPrice: asNumber(project.minimumPrice),
    maxPrice: asNumber(project.maximumPrice),
    currency: String(currency || "AED"),
    minSize: asNumber(project.area),
    maxSize: asNumber(project.area),
    areaUnit: typeof project.areaUnit === "string" ? project.areaUnit : "sqft",
    serviceCharge:
      project.monetaryInfo?.maintenanceCost != null
        ? String(project.monetaryInfo.maintenanceCost)
        : null,
    depositDescription: paymentRatio,
    buildingCount: asNumber(project.totalBlocks),
    unitsCount: asNumber(project.totalFlats),
    developer: developerName
      ? {
          name: developerName,
          website: null,
        }
      : undefined,
    address,
    community: address?.community
      ? { name: address.community }
      : address?.subLocality
        ? { name: address.subLocality }
        : undefined,
    area: address?.district
      ? { name: address.district }
      : address?.locality
        ? { name: address.locality }
        : undefined,
    city: address?.city ? { name: address.city } : undefined,
    country: address?.country ? { name: address.country } : undefined,
    propertyType: typeName ? { name: typeName } : undefined,
    amenities: (project.amenities ?? [])
      .filter((a): a is { id?: string; amenityDisplayName: string } =>
        Boolean(a?.amenityDisplayName),
      )
      .map((a) => ({
        externalId: a.id ?? null,
        name: a.amenityDisplayName,
      })),
    banks: (project.associatedBanks ?? []).map((id: string) => ({
      externalId: id,
      name: `Bank ${id.slice(0, 8)}`,
    })),
    images,
    videos,
    brochures,
    documents,
    paymentPlans,
    providerUpdatedAt: project.lastModifiedOn ?? null,
    raw: project,
  };
}

/** Stable hash for change detection — excludes volatile raw payload. */
export function hashCanonicalProperty(property: CanonicalProperty): string {
  const { raw: _raw, ...rest } = property;
  const stable = JSON.stringify(rest, Object.keys(rest).sort());
  return createHash("sha256").update(stable).digest("hex");
}

export function mapLeadToLeadRatPayload(lead: {
  name: string;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
  leadSource?: string | null;
  propertyTitle?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  landingPage?: string | null;
  campaign?: string | null;
}) {
  return {
    name: lead.name,
    contactNo: lead.phone ?? lead.whatsapp ?? undefined,
    email: lead.email ?? undefined,
    notes: [
      lead.notes,
      lead.propertyTitle ? `Property: ${lead.propertyTitle}` : null,
      lead.campaign ? `Campaign: ${lead.campaign}` : null,
      lead.landingPage ? `Landing: ${lead.landingPage}` : null,
      lead.utmSource || lead.utmMedium || lead.utmCampaign
        ? `UTM: ${[lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    // LeadRat source enums are constrained; website is safest default for web captures
    source: "website",
    subSource: lead.leadSource ?? lead.utmSource ?? "prowin-website",
  };
}
