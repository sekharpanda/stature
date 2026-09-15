/**
 * LeadRat Off Plan public listings API
 * Base: https://projectsapi.leadrat.com/api/public
 */

import { AppError } from "@/lib/errors";
import {
  assertOffPlanConfigured,
  getOffPlanConfig,
  type OffPlanConfig,
} from "./offplan-config";

export type OffPlanListResponse = {
  count: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  results: OffPlanListingCard[];
};

export type OffPlanListingCard = {
  id: string;
  name?: string | null;
  developerName?: string | null;
  district?: string | null;
  constructionStatus?: string | null;
  saleStatus?: string | null;
  completionDate?: string | null;
  completionQuarter?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  priceCurrency?: string | null;
  currencies?: Array<{
    currencyCode?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    preHandoverPercentage?: number | null;
    postHandoverPercentage?: number | null;
  }>;
  pricing?: unknown;
  units?: unknown;
  minSize?: number | null;
  maxSize?: number | null;
  coverImageUrl?: string | null;
  coverImageFallbackUrl?: string | null;
  buildingCount?: number | null;
  unitCount?: number | null;
  preHandoverPercentage?: number | null;
  postHandoverPercentage?: number | null;
  paymentPlans?: Array<{
    preHandoverPercentage?: number | null;
    postHandoverPercentage?: number | null;
  }>;
  developerLogo?: string | null;
  isRecommended?: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

export type OffPlanListingDetail = {
  project: OffPlanProjectDetail;
};

export type OffPlanProjectDetail = OffPlanListingCard & {
  developer?: {
    id?: string;
    name?: string | null;
    logoUrl?: string | null;
    website?: string | null;
    externalId?: number | null;
  } | null;
  externalId?: number | string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  fullAddress?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  videoReviewUrl?: string | null;
  generalPlanUrl?: string | null;
  escrowNumber?: string | null;
  reraNumber?: string | null;
  serviceCharge?: string | number | null;
  furnishing?: string | null;
  postHandover?: boolean;
  readinessProgress?: number | null;
  managingCompany?: string | null;
  brand?: string | null;
  areaUnit?: string | null;
  currency?: string | null;
  galleryImages?: Array<{
    id?: string;
    category?: string | null;
    imageUrl?: string | null;
    imageFallbackUrl?: string | null;
    caption?: string | null;
    displayOrder?: number | null;
  }>;
  amenities?: Array<{
    id?: string;
    name?: string;
    iconUrl?: string | null;
    displayOrder?: number | null;
  }>;
  paymentPlans?: Array<{
    id?: string;
    name?: string | null;
    preHandoverPercentage?: number | null;
    postHandoverPercentage?: number | null;
    steps?: Array<{
      id?: string;
      name?: string;
      percentage?: number | null;
      displayOrder?: number | null;
      isPreHandover?: boolean;
    }>;
  }>;
  documents?: Array<{
    name?: string | null;
    url?: string | null;
    fallbackUrl?: string | null;
    type?: string | null;
    displayOrder?: number | null;
  }>;
  typicalUnits?: Array<{
    id?: string;
    bedrooms?: number | null;
    area?: number | null;
    price?: number | null;
    unitType?: string | null;
    displayOrder?: number | null;
  }>;
  unitSummary?: {
    totalAvailableUnits?: number | null;
    bedroomGroups?: Array<{
      unitType?: string | null;
      bedrooms?: number | null;
      bedroomLabel?: string | null;
      unitCount?: number | null;
      minSize?: number | null;
      maxSize?: number | null;
      minPrice?: number | null;
      maxPrice?: number | null;
      floorPlanImageUrl?: string | null;
    }>;
  } | null;
  nearbyLandmarks?: unknown;
  highlights?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
};

async function offPlanFetch<T>(
  path: string,
  options?: {
    query?: Record<string, string | number | boolean | undefined | null>;
    config?: Partial<OffPlanConfig>;
  },
): Promise<T> {
  const config = getOffPlanConfig(options?.config);
  assertOffPlanConfigured(config);

  const url = new URL(
    path.startsWith("http")
      ? path
      : `${config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
  );
  url.searchParams.set("apiKey", config.apiKey);

  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new AppError(`Off Plan API error (${response.status})`, {
      code: "OFFPLAN_HTTP",
      status: 502,
      details: typeof json === "object" ? json : text.slice(0, 500),
    });
  }

  return json as T;
}

export const offPlanClient = {
  getConfig: getOffPlanConfig,

  async listListings(params?: {
    page?: number;
    pageSize?: number;
    config?: Partial<OffPlanConfig>;
  }) {
    return offPlanFetch<OffPlanListResponse>("/listings", {
      query: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 50,
      },
      config: params?.config,
    });
  },

  async getListing(id: string, config?: Partial<OffPlanConfig>) {
    return offPlanFetch<OffPlanListingDetail>(`/listings/${id}`, { config });
  },
};
