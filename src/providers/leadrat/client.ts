/**
 * Shared LeadRat Enterprise API client.
 * Docs: https://apidoc.leadrat.info/
 * Server-only — never import from client components.
 */

import { AppError } from "@/lib/errors";
import {
  assertLeadRatConfigured,
  getLeadRatConfig,
  type LeadRatConfig,
} from "./config";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

const globalForLeadRat = globalThis as unknown as {
  leadRatTokenCache?: TokenCache | null;
};

export type LeadRatEnvelope<T> = {
  succeeded?: boolean;
  message?: string;
  errors?: string[] | null;
  data?: T;
  items?: T extends unknown[] ? T : T[];
  itemsCount?: number;
  totalCount?: number;
  actionCode?: number;
};

async function requestToken(config: LeadRatConfig): Promise<TokenCache> {
  const response = await fetch(`${config.baseUrl}/authentication/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      tenant: config.tenant,
      Accept: "application/json",
    },
    body: JSON.stringify({
      apiKey: config.apiKey,
      secretKey: config.secretKey,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AppError(`LeadRat auth failed (${response.status})`, {
      code: "LEADRAT_AUTH",
      status: 502,
      details: body.slice(0, 500),
    });
  }

  const json = (await response.json()) as {
    accessToken?: string;
    expiresIn?: number;
    tokenType?: string;
    data?: {
      accessToken?: string;
      expiresIn?: number;
      tokenType?: string;
    };
    succeeded?: boolean;
  };

  const accessToken = json.data?.accessToken ?? json.accessToken;
  const expiresIn = json.data?.expiresIn ?? json.expiresIn ?? 3600;

  if (!accessToken) {
    throw new AppError("LeadRat auth response missing accessToken", {
      code: "LEADRAT_AUTH",
      status: 502,
      details: json,
    });
  }

  const expiresInMs = Math.max(30, expiresIn - 60) * 1000;
  return {
    accessToken,
    expiresAt: Date.now() + expiresInMs,
  };
}

async function getAccessToken(config: LeadRatConfig): Promise<string> {
  const cached = globalForLeadRat.leadRatTokenCache;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }
  const next = await requestToken(config);
  globalForLeadRat.leadRatTokenCache = next;
  return next.accessToken;
}

function clearTokenCache() {
  globalForLeadRat.leadRatTokenCache = null;
}

export async function leadRatFetch<T>(
  path: string,
  options?: {
    method?: string;
    query?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    config?: Partial<LeadRatConfig>;
    retryAuth?: boolean;
  },
): Promise<T> {
  const config = getLeadRatConfig(options?.config);
  assertLeadRatConfigured(config);

  const url = new URL(
    path.startsWith("http")
      ? path
      : `${config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
  );

  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const token = await getAccessToken(config);
  const response = await fetch(url.toString(), {
    method: options?.method ?? "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      tenant: config.tenant,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 401 && options?.retryAuth !== false) {
    clearTokenCache();
    return leadRatFetch<T>(path, { ...options, retryAuth: false });
  }

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new AppError(`LeadRat API error (${response.status})`, {
      code: "LEADRAT_HTTP",
      status: 502,
      details: typeof json === "object" ? json : text.slice(0, 500),
    });
  }

  return json as T;
}

export const leadRatClient = {
  getConfig: getLeadRatConfig,
  clearTokenCache,

  /** CRM lead push only — inventory uses offPlanClient */
  async createLead(body: Record<string, unknown>, config?: Partial<LeadRatConfig>) {
    return leadRatFetch<LeadRatEnvelope<string>>("/lead", {
      method: "POST",
      body,
      config,
    });
  },
};

/** Loose LeadRat project shape — fields optional because API varies by tenant. */
export type LeadRatAddress = {
  id?: string;
  placeId?: string | null;
  subLocality?: string | null;
  locality?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  longitude?: string | number | null;
  latitude?: string | number | null;
  isGoogleMapLocation?: boolean;
  community?: string | null;
  subCommunity?: string | null;
  towerName?: string | null;
};

export type LeadRatGalleryItem = {
  name?: string | null;
  imageFilePath?: string | null;
  url?: string | null;
  isCoverImage?: boolean;
  galleryType?: string | number | null;
};

export type LeadRatProject = {
  id: string;
  name?: string | null;
  description?: string | null;
  notes?: string | null;
  status?: string | null;
  currentStatus?: string | null;
  area?: number | null;
  areaUnit?: string | null;
  certificates?: string | null;
  facings?: string[] | null;
  totalBlocks?: number | null;
  totalFloor?: number | null;
  totalFlats?: number | null;
  minimumPrice?: number | null;
  maximumPrice?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  possessionDate?: string | null;
  possesionType?: string | null;
  possessionType?: string | null;
  reraNumbers?: string[] | null;
  associatedBanks?: string[] | null;
  links?: string[] | null;
  lastModifiedOn?: string | null;
  createdOn?: string | null;
  projectType?: {
    id?: string;
    type?: string;
    displayName?: string;
    Type?: string;
    DisplayName?: string;
  } | null;
  builderDetails?: {
    name?: string | null;
    ContactNo?: string | null;
    PointOfContact?: string | null;
  } | null;
  monetaryInfo?: {
    Currency?: string | null;
    currency?: string | null;
    maintenanceCost?: string | number | null;
    brokerage?: string | number | null;
  } | null;
  address?: LeadRatAddress | null;
  amenities?: Array<{
    id?: string;
    amenityDisplayName?: string;
    defaultValue?: string;
  }> | null;
  imageUrls?: Record<string, LeadRatGalleryItem[] | undefined> | null;
  videos?: LeadRatGalleryItem[] | null;
  brochures?: Array<{ name?: string | null; url?: string | null }> | null;
  documents?: Array<{
    id?: string;
    documentName?: string | null;
    filePath?: string | null;
  }> | null;
};
