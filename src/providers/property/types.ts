/**
 * Canonical property shape inside REOS.
 * Aligned to LeadRat Project API — see docs/architecture/LEADRAT-INTEGRATION.md
 * Public APIs must map to PublicPropertyDto (source + sync stripped).
 */

export type PropertySource = "MANUAL" | "LEADRAT";

export type GalleryKind =
  | "COVER"
  | "LOBBY"
  | "INTERIOR"
  | "ARCHITECTURE"
  | "GENERAL_PLAN"
  | "UNIT_LAYOUT"
  | "OTHER";

export interface ProviderMediaObject {
  url: string;
  mime?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface CanonicalAmenity {
  externalId?: string | null;
  name: string;
  iconUrl?: string | null;
  projectIconUrl?: string | null;
}

export interface CanonicalUnitType {
  externalId?: string | null;
  name?: string | null;
  unitType?: string | null;
  normalizedType?: string | null;
  bedroomsLabel?: string | null;
  bedrooms?: number | null;
  unitsAmount?: number | null;
  areaFrom?: number | null;
  areaTo?: number | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  priceFromAed?: number | null;
  priceToAed?: number | null;
  priceFromUsd?: number | null;
  priceToUsd?: number | null;
  sizeFromSqft?: number | null;
  sizeToSqft?: number | null;
  sizeFromM2?: number | null;
  sizeToM2?: number | null;
  areaUnit?: string | null;
  priceCurrency?: string | null;
  typicalImageUrl?: string | null;
  layouts?: Array<ProviderMediaObject & { sortOrder?: number }>;
}

export interface CanonicalBuilding {
  externalId?: string | null;
  name?: string | null;
  buildingType?: string | null;
  floorsCount?: number | null;
  area?: number | null;
  description?: string | null;
  constructionStartDate?: string | null;
  constructionEndDate?: string | null;
  escrow?: string | null;
  coverImageUrl?: string | null;
}

export interface CanonicalPaymentPlan {
  externalId?: string | null;
  title: string;
  durationMonths?: number | null;
  isHandover?: boolean;
  monthsAfterHandover?: number | null;
  eoi?: string | null;
  steps?: Array<{
    name: string;
    percent?: number | null;
    amount?: number | null;
    dueLabel?: string | null;
    sortOrder?: number;
  }>;
}

export interface CanonicalAddress {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  district?: string | null;
  locality?: string | null;
  subLocality?: string | null;
  community?: string | null;
  subCommunity?: string | null;
  tower?: string | null;
  sector?: string | null;
  village?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  mapLocation?: string | null;
  polygon?: unknown;
  externalLocationId?: string | null;
}

/**
 * Full canonical project/property used by providers → sync service → repository.
 * Field names intentionally mirror LeadRat / upstream catalog concepts; persistence is normalized.
 */
export interface CanonicalProperty {
  source: PropertySource;
  leadratProjectId?: string | null;
  reellyProjectId?: string | null;
  reellySlug?: string | null;
  name: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  constructionStatus?: string | null;
  saleStatus?: string | null;
  completionLabel?: string | null;
  possessionDate?: string | null;
  constructionStartDate?: string | null;
  constructionEndDate?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  currency: string;
  minSize?: number | null;
  maxSize?: number | null;
  areaUnit?: string | null;
  furnishing?: string | null;
  hasEscrow?: boolean;
  escrowNumber?: string | null;
  postHandover?: boolean;
  serviceCharge?: string | null;
  depositDescription?: string | null;
  brand?: string | null;
  managingCompany?: string | null;
  readinessProgress?: number | null;
  website?: string | null;
  unitsCount?: number | null;
  buildingCount?: number | null;
  isPartnerProject?: boolean;
  isFeatured?: boolean;
  isVerified?: boolean;
  /** Manual / NRI upload status — LeadRat sync always creates DRAFT */
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "EXPIRED";
  /** Extended NRI-style fields not mapped to first-class columns */
  details?: Record<string, unknown> | null;
  developer?: {
    name: string;
    externalId?: string | null;
    logoUrl?: string | null;
    website?: string | null;
  };
  address?: CanonicalAddress;
  community?: { name: string; externalId?: string | null };
  area?: { name: string; externalId?: string | null };
  city?: { name: string };
  country?: { name: string; isoCode?: string };
  propertyType?: { name: string };
  category?: { name: string };
  amenities?: CanonicalAmenity[];
  banks?: Array<{ name: string; externalId?: string | null; logoUrl?: string | null }>;
  images?: Array<
    ProviderMediaObject & {
      galleryKind: GalleryKind;
      caption?: string | null;
      alt?: string | null;
      sortOrder?: number;
      isCover?: boolean;
      externalId?: string | null;
    }
  >;
  videos?: Array<{
    title?: string | null;
    speakerName?: string | null;
    speakerPhoto?: string | null;
    url?: string | null;
    videoFileUrl?: string | null;
    provider?: string | null;
    externalId?: string | null;
    sortOrder?: number;
  }>;
  brochures?: Array<{
    title?: string | null;
    url: string;
    externalId?: string | null;
    sortOrder?: number;
  }>;
  documents?: Array<{
    title: string;
    kind?: string;
    url?: string | null;
    description?: string | null;
    externalId?: string | null;
    sortOrder?: number;
  }>;
  floorPlans?: Array<{
    title: string;
    description?: string | null;
    fileUrl?: string | null;
    imageUrl?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    areaSqft?: number | null;
    price?: number | null;
    externalId?: string | null;
    sortOrder?: number;
  }>;
  buildings?: CanonicalBuilding[];
  unitTypes?: CanonicalUnitType[];
  paymentPlans?: CanonicalPaymentPlan[];
  parkings?: Array<{
    externalId?: string | null;
    name?: string | null;
    unitType?: string | null;
    parkingSpace?: number | null;
    bedrooms?: string[];
  }>;
  mapPoints?: Array<{
    name: string;
    distanceKm?: number | null;
    timeMinutes?: number | null;
  }>;
  /** Opaque provider payload retained for remapping / debug */
  raw?: unknown;
  providerUpdatedAt?: string | null;
  seo?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    canonicalUrl?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    twitterTitle?: string | null;
    twitterDescription?: string | null;
    keywords?: string | null;
  } | null;
}

/** Safe for frontend / public API — never includes source or sync internals */
export interface PublicPropertyDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  status: string;
  saleStatus?: string | null;
  constructionStatus?: string | null;
  minPrice?: string | number | null;
  maxPrice?: string | number | null;
  currency: string;
  minSize?: string | number | null;
  maxSize?: string | number | null;
  areaUnit?: string | null;
  completionLabel?: string | null;
  possessionDate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isFeatured: boolean;
  isVerified: boolean;
  developer?: { id: string; name: string; slug: string; logoUrl?: string | null } | null;
  community?: { id: string; name: string; slug: string } | null;
  area?: { id: string; name: string; slug: string } | null;
  city?: { id: string; name: string; slug: string } | null;
  coverImage?: { id: string; url: string; alt?: string | null } | null;
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    caption?: string | null;
    galleryKind: string;
    isCover: boolean;
  }>;
  amenities: Array<{ id: string; name: string; slug: string; icon?: string | null }>;
  banks: Array<{ id: string; name: string; slug: string; logoUrl?: string | null }>;
}

export interface PropertySearchParams {
  organizationId: string;
  keyword?: string;
  location?: string;
  communityId?: string;
  developerId?: string;
  areaId?: string;
  cityId?: string;
  propertyTypeId?: string;
  bedrooms?: number;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  constructionStatus?: string;
  saleStatus?: string;
  completionStatus?: string;
  amenityIds?: string[];
  furnishing?: string;
  featured?: boolean;
  source?: PropertySource;
  sortBy?: "price_asc" | "price_desc" | "newest" | "featured";
  cursor?: string;
  limit?: number;
}

export interface PropertyProviderContext {
  organizationId: string;
  credentials?: Record<string, unknown>;
  preferredCurrency?: "AED" | "USD";
  preferredAreaUnit?: "sqft" | "m2";
  language?: string;
}

export interface ProviderListPage {
  items: CanonicalProperty[];
  count: number;
  nextOffset?: number | null;
  hasMore: boolean;
}

export interface PropertySyncResult {
  imported: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: Array<{ externalId?: string; message: string }>;
}

/**
 * Property Provider — all external/manual property sources implement this.
 * UI and public APIs never call providers directly.
 */
export interface PropertyProvider {
  readonly name: string;
  listProjects?(
    ctx: PropertyProviderContext,
    options?: { limit?: number; offset?: number; updatedSince?: string },
  ): Promise<ProviderListPage>;
  fetchAll(ctx: PropertyProviderContext): Promise<CanonicalProperty[]>;
  fetchByExternalId?(
    ctx: PropertyProviderContext,
    externalId: string,
  ): Promise<CanonicalProperty | null>;
  sync?(ctx: PropertyProviderContext): Promise<PropertySyncResult>;
}
