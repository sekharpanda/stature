import { createHash } from "crypto";

import type { ApiSource, ApiSourceTarget, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { organizationRepository } from "@/repositories/organization.repository";

export type ApiFieldMap = Record<string, string>;
export type UpsertOutcome = "imported" | "updated" | "skipped";

export type ApiSourceInput = {
  name: string;
  target: ApiSourceTarget;
  method?: string;
  url: string;
  headers?: Record<string, string>;
  authType?: "none" | "bearer" | "basic";
  authValue?: string | null;
  itemsPath?: string | null;
  fieldMap: ApiFieldMap;
  autoPublish?: boolean;
  enabled?: boolean;
};

export type ApiSyncResult = {
  imported: number;
  updated: number;
  skipped: number;
  fetched: number;
  errors: Array<{ externalId?: string; message: string }>;
  durationMs: number;
  preview?: unknown[];
};

export const API_SOURCE_TARGETS = [
  "BLOG",
  "INSIGHT",
  "FAQ",
  "TESTIMONIAL",
  "DEVELOPER",
  "AREA",
  "COMMUNITY",
  "AGENT",
  "AMENITY",
  "PROPERTY",
  "CATEGORY",
  "PAGE",
  "LANDING_PAGE",
] as const satisfies readonly ApiSourceTarget[];

const DEFAULT_FIELD_MAPS: Record<ApiSourceTarget, ApiFieldMap> = {
  BLOG: {
    externalId: "id",
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    content: "content",
    coverUrl: "coverUrl",
    publishedAt: "publishedAt",
    canonicalUrl: "url",
  },
  INSIGHT: {
    externalId: "id",
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    content: "content",
    coverUrl: "coverUrl",
    publishedAt: "publishedAt",
    canonicalUrl: "url",
  },
  FAQ: {
    externalId: "id",
    question: "question",
    answer: "answer",
  },
  TESTIMONIAL: {
    externalId: "id",
    authorName: "authorName",
    authorRole: "authorRole",
    content: "content",
    rating: "rating",
  },
  DEVELOPER: {
    externalId: "id",
    name: "name",
    slug: "slug",
    shortDescription: "shortDescription",
    description: "description",
    website: "website",
    email: "email",
    phone: "phone",
    logoUrl: "logoUrl",
    headquarters: "headquarters",
    foundedYear: "foundedYear",
  },
  AREA: {
    externalId: "id",
    name: "name",
    slug: "slug",
    cityName: "cityName",
    shortDescription: "shortDescription",
    description: "description",
    latitude: "latitude",
    longitude: "longitude",
    investmentHighlights: "investmentHighlights",
  },
  COMMUNITY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    areaName: "areaName",
    areaSlug: "areaSlug",
    shortDescription: "shortDescription",
    description: "description",
  },
  AGENT: {
    externalId: "id",
    name: "name",
    slug: "slug",
    email: "email",
    phone: "phone",
    whatsapp: "whatsapp",
    title: "title",
    bio: "bio",
    photoUrl: "photoUrl",
    reraNumber: "reraNumber",
  },
  AMENITY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    icon: "icon",
    iconUrl: "iconUrl",
  },
  PROPERTY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    description: "description",
    shortDescription: "shortDescription",
    minPrice: "minPrice",
    maxPrice: "maxPrice",
    currency: "currency",
    developerName: "developerName",
    areaName: "areaName",
    coverUrl: "coverUrl",
  },
  CATEGORY: {
    externalId: "id",
    name: "name",
    slug: "slug",
    description: "description",
  },
  PAGE: {
    externalId: "id",
    title: "title",
    slug: "slug",
    excerpt: "excerpt",
    body: "body",
  },
  LANDING_PAGE: {
    externalId: "id",
    title: "title",
    slug: "slug",
    campaign: "campaign",
  },
};

function getByPath(value: unknown, path: string): unknown {
  if (!path) return value;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur: unknown = value;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** Strapi REST returns meta.pagination.pageCount — loop until all pages are fetched. */
function getStrapiPagination(payload: unknown) {
  const raw = getByPath(payload, "meta.pagination");
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const page = Number(p.page);
  const pageCount = Number(p.pageCount);
  const total = Number(p.total);
  if (!Number.isFinite(pageCount) || pageCount <= 1) return null;
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageCount,
    total: Number.isFinite(total) ? total : 0,
  };
}

function urlForStrapiPage(baseUrl: string, page: number) {
  const url = new URL(baseUrl);
  url.searchParams.set("pagination[page]", String(page));
  return url.toString();
}

function asString(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.rendered === "string") return obj.rendered.trim();
    if (typeof obj.html === "string") return obj.html.trim();
    if (typeof obj.text === "string") return obj.text.trim();
  }
  return "";
}

function asNumber(value: string) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractItems(payload: unknown, itemsPath?: string | null): unknown[] {
  if (itemsPath?.trim()) {
    const at = getByPath(payload, itemsPath.trim());
    if (Array.isArray(at)) return at;
    return at ? [at] : [];
  }
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of [
    "data",
    "posts",
    "items",
    "results",
    "articles",
    "faqs",
    "testimonials",
    "developers",
    "areas",
    "communities",
    "agents",
    "amenities",
    "properties",
    "categories",
    "pages",
  ]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    const nested = obj.data as Record<string, unknown>;
    for (const key of ["posts", "items", "results", "data"]) {
      if (Array.isArray(nested[key])) return nested[key] as unknown[];
    }
  }
  return [];
}

function mapRow(row: unknown, fieldMap: ApiFieldMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [dest, srcPath] of Object.entries(fieldMap)) {
    if (!srcPath) continue;
    out[dest] = asString(getByPath(row, srcPath));
  }
  return out;
}

function externalKey(mapped: Record<string, string>, fallback: string) {
  return (
    mapped.externalId ||
    createHash("sha1").update(fallback).digest("hex").slice(0, 16)
  );
}

async function resolveOrgId(organizationId?: string) {
  if (organizationId) return organizationId;
  const org = await organizationRepository.getDefault();
  if (!org) throw new AppError("Organization not configured", { status: 500 });
  return org.id;
}

async function uniqueSlugFor(
  organizationId: string,
  kind:
    | "blogPost"
    | "developer"
    | "area"
    | "community"
    | "agent"
    | "amenity"
    | "property"
    | "category"
    | "page"
    | "landingPage",
  preferred: string,
  excludeId?: string,
) {
  const base = slugify(preferred) || "item";
  let candidate = base;
  let n = 2;
  for (;;) {
    const where = {
      organizationId,
      slug: candidate,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    };
    const existing =
      kind === "blogPost"
        ? await prisma.blogPost.findFirst({ where, select: { id: true } })
        : kind === "developer"
          ? await prisma.developer.findFirst({ where, select: { id: true } })
          : kind === "area"
            ? await prisma.area.findFirst({ where, select: { id: true } })
            : kind === "community"
              ? await prisma.community.findFirst({ where, select: { id: true } })
              : kind === "agent"
                ? await prisma.agent.findFirst({ where, select: { id: true } })
                : kind === "amenity"
                  ? await prisma.amenity.findFirst({
                      where,
                      select: { id: true },
                    })
                  : kind === "property"
                    ? await prisma.property.findFirst({
                        where,
                        select: { id: true },
                      })
                    : kind === "category"
                      ? await prisma.propertyCategory.findFirst({
                          where,
                          select: { id: true },
                        })
                      : kind === "page"
                        ? await prisma.page.findFirst({
                            where,
                            select: { id: true },
                          })
                        : await prisma.landingPage.findFirst({
                            where,
                            select: { id: true },
                          });
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

async function resolveCityId(organizationId: string, cityName?: string) {
  const name = cityName?.trim() || "Dubai";
  const slug = slugify(name) || "dubai";
  const existing = await prisma.city.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const country =
    (await prisma.country.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { slug: "uae" },
          { name: { equals: "United Arab Emirates", mode: "insensitive" } },
          { isoCode: "AE" },
        ],
      },
      select: { id: true },
    })) ??
    (await prisma.country.create({
      data: {
        organizationId,
        name: "United Arab Emirates",
        slug: "uae",
        isoCode: "AE",
      },
      select: { id: true },
    }));

  return (
    await prisma.city.create({
      data: { organizationId, countryId: country.id, name, slug },
      select: { id: true },
    })
  ).id;
}

async function resolveAreaId(
  organizationId: string,
  areaName?: string,
  areaSlug?: string,
  options?: { createIfMissing?: boolean },
) {
  const name = areaName?.trim() || "";
  const slug = slugify(areaSlug || name || "");
  if (!slug && !name) return null;
  const existing = await prisma.area.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      OR: [
        ...(slug ? [{ slug }] : []),
        ...(name
          ? [{ name: { equals: name, mode: "insensitive" as const } }]
          : []),
      ],
    },
    select: { id: true },
  });
  if (existing) return existing.id;
  if (!options?.createIfMissing || !name) return null;

  const cityId = await resolveCityId(organizationId, "Dubai");
  const created = await prisma.area.create({
    data: {
      organizationId,
      cityId,
      name,
      slug: await uniqueSlugFor(organizationId, "area", slug || name),
      isPublished: true,
    },
    select: { id: true },
  });
  return created.id;
}

async function resolveDeveloperId(
  organizationId: string,
  developerName?: string,
) {
  if (!developerName) return null;
  const existing = await prisma.developer.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      name: { equals: developerName, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (existing) return existing.id;
  const slug = await uniqueSlugFor(organizationId, "developer", developerName);
  const created = await prisma.developer.create({
    data: {
      organizationId,
      name: developerName,
      slug,
      source: "MANUAL",
      isPublished: true,
    },
    select: { id: true },
  });
  return created.id;
}

function withCover(content: string, coverUrl: string) {
  const body = content.trim();
  const cover = absolutizeStrapiAssetUrl(coverUrl);
  if (!cover) return body || null;
  return `<!--cover:${cover}-->\n${body}`;
}

const STRAPI_ASSET_BASE =
  process.env.STRAPI_ASSET_BASE_URL?.replace(/\/$/, "") ??
  "https://prowin.propphy.com";

function absolutizeStrapiAssetUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${STRAPI_ASSET_BASE}${trimmed}`;
  return trimmed;
}

/** Strapi blog HTML often references /uploads/... without a host. */
function rewriteStrapiHtmlAssets(html: string) {
  if (!html.trim()) return html;
  return html.replace(
    /(src|href)=(["'])(\/uploads\/[^"']+)\2/gi,
    (_match, attr: string, quote: string, path: string) =>
      `${attr}=${quote}${absolutizeStrapiAssetUrl(path)}${quote}`,
  );
}

async function fetchRemote(source: {
  url: string;
  method: string;
  headers: unknown;
  authType: string;
  authValue: string | null;
}) {
  const headers = new Headers({ Accept: "application/json" });
  const extra =
    source.headers && typeof source.headers === "object"
      ? (source.headers as Record<string, string>)
      : {};
  for (const [k, v] of Object.entries(extra)) {
    if (k && v) headers.set(k, v);
  }
  if (source.authType === "bearer" && source.authValue) {
    headers.set("Authorization", `Bearer ${source.authValue}`);
  } else if (source.authType === "basic" && source.authValue) {
    headers.set(
      "Authorization",
      `Basic ${Buffer.from(source.authValue).toString("base64")}`,
    );
  }

  const res = await fetch(source.url, {
    method: (source.method || "GET").toUpperCase(),
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new AppError(
      `API ${res.status}: ${text.slice(0, 240) || res.statusText}`,
      { code: "API_FETCH", status: 502 },
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError("API did not return JSON", {
      code: "API_NOT_JSON",
      status: 502,
    });
  }
}

async function upsertBlog(
  organizationId: string,
  sourceKey: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  const title = mapped.title;
  if (!title) throw new Error("Missing mapped title");
  const externalId = externalKey(mapped, `${title}:${mapped.slug}`);
  const existing = await prisma.blogPost.findFirst({
    where: { organizationId, source: sourceKey, externalId, deletedAt: null },
    select: { id: true, publishedAt: true },
  });
  const content = withCover(
    rewriteStrapiHtmlAssets(mapped.content || ""),
    mapped.coverUrl || "",
  );
  const publishedAt = mapped.publishedAt
    ? new Date(mapped.publishedAt)
    : new Date();

  if (!existing) {
    await prisma.blogPost.create({
      data: {
        organizationId,
        title,
        slug: await uniqueSlugFor(organizationId, "blogPost", mapped.slug || title),
        excerpt: mapped.excerpt || null,
        content,
        canonicalUrl: mapped.canonicalUrl || null,
        source: sourceKey,
        externalId,
        workflowState: autoPublish ? "PUBLISHED" : "DRAFT",
        publishedAt: autoPublish
          ? Number.isNaN(publishedAt.getTime())
            ? new Date()
            : publishedAt
          : null,
      },
    });
    return "imported";
  }

  await prisma.blogPost.update({
    where: { id: existing.id },
    data: {
      title,
      slug: await uniqueSlugFor(
        organizationId,
        "blogPost",
        mapped.slug || title,
        existing.id,
      ),
      excerpt: mapped.excerpt || null,
      content,
      canonicalUrl: mapped.canonicalUrl || null,
      ...(autoPublish
        ? {
            workflowState: "PUBLISHED" as const,
            publishedAt: existing.publishedAt ?? publishedAt,
          }
        : {}),
    },
  });
  return "updated";
}

async function upsertFaq(
  organizationId: string,
  sourceKey: string,
  mapped: Record<string, string>,
): Promise<UpsertOutcome> {
  const question = mapped.question;
  const answer = mapped.answer;
  if (!question || !answer) throw new Error("Missing mapped question/answer");
  const externalId = externalKey(mapped, question);
  const existing = await prisma.faq.findFirst({
    where: { organizationId, source: sourceKey, externalId, deletedAt: null },
    select: { id: true, question: true, answer: true },
  });
  if (existing) {
    if (existing.question === question && existing.answer === answer) {
      return "skipped";
    }
    await prisma.faq.update({
      where: { id: existing.id },
      data: { question, answer },
    });
    return "updated";
  }
  await prisma.faq.create({
    data: { organizationId, question, answer, source: sourceKey, externalId },
  });
  return "imported";
}

async function upsertTestimonial(
  organizationId: string,
  sourceKey: string,
  mapped: Record<string, string>,
): Promise<UpsertOutcome> {
  const authorName = mapped.authorName;
  const content = mapped.content;
  if (!authorName || !content) {
    throw new Error("Missing mapped authorName/content");
  }
  const externalId = externalKey(mapped, `${authorName}:${content}`);
  const ratingRaw = mapped.rating ? Number(mapped.rating) : null;
  const rating =
    ratingRaw != null && Number.isFinite(ratingRaw)
      ? Math.min(5, Math.max(0, ratingRaw))
      : null;
  const existing = await prisma.testimonial.findFirst({
    where: { organizationId, source: sourceKey, externalId, deletedAt: null },
    select: { id: true, authorName: true, content: true },
  });
  if (existing) {
    if (existing.authorName === authorName && existing.content === content) {
      return "skipped";
    }
    await prisma.testimonial.update({
      where: { id: existing.id },
      data: {
        authorName,
        authorRole: mapped.authorRole || null,
        content,
        rating,
      },
    });
    return "updated";
  }
  await prisma.testimonial.create({
    data: {
      organizationId,
      authorName,
      authorRole: mapped.authorRole || null,
      content,
      rating,
      source: sourceKey,
      externalId,
    },
  });
  return "imported";
}

async function upsertDeveloper(
  organizationId: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  const name = mapped.name;
  if (!name) throw new Error("Missing mapped name");
  const externalId = mapped.externalId || null;
  const existing = externalId
    ? await prisma.developer.findFirst({
        where: {
          organizationId,
          externalId,
          source: "MANUAL",
          deletedAt: null,
        },
        select: { id: true },
      })
    : await prisma.developer.findFirst({
        where: {
          organizationId,
          slug: slugify(mapped.slug || name),
          deletedAt: null,
        },
        select: { id: true },
      });

  const data = {
    name,
    shortDescription: mapped.shortDescription || null,
    description: mapped.description || null,
    website: mapped.website || null,
    email: mapped.email || null,
    phone: mapped.phone || null,
    logoUrl: mapped.logoUrl || null,
    headquarters: mapped.headquarters || null,
    foundedYear: asNumber(mapped.foundedYear)
      ? Math.round(asNumber(mapped.foundedYear)!)
      : null,
    isPublished: autoPublish,
    externalId,
    source: "MANUAL" as const,
  };

  if (!existing) {
    await prisma.developer.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(organizationId, "developer", mapped.slug || name),
        ...data,
      },
    });
    return "imported";
  }
  await prisma.developer.update({
    where: { id: existing.id },
    data: {
      ...data,
      slug: await uniqueSlugFor(
        organizationId,
        "developer",
        mapped.slug || name,
        existing.id,
      ),
    },
  });
  return "updated";
}

async function upsertArea(
  organizationId: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  const name = mapped.name;
  if (!name) throw new Error("Missing mapped name");
  const preferredSlug = slugify(mapped.slug || name);
  const existing = await prisma.area.findFirst({
    where: { organizationId, slug: preferredSlug, deletedAt: null },
    select: { id: true },
  });
  const cityId = await resolveCityId(organizationId, mapped.cityName);
  const data = {
    name,
    cityId,
    shortDescription: mapped.shortDescription || null,
    description: mapped.description || null,
    latitude: asNumber(mapped.latitude),
    longitude: asNumber(mapped.longitude),
    investmentHighlights: mapped.investmentHighlights || null,
    isPublished: autoPublish,
  };
  if (!existing) {
    await prisma.area.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(organizationId, "area", mapped.slug || name),
        ...data,
      },
    });
    return "imported";
  }
  await prisma.area.update({
    where: { id: existing.id },
    data,
  });
  return "updated";
}

async function upsertCommunity(
  organizationId: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  const name = mapped.name;
  if (!name) throw new Error("Missing mapped name");
  const areaId = await resolveAreaId(
    organizationId,
    mapped.areaName,
    mapped.areaSlug,
    { createIfMissing: true },
  );
  if (!areaId) {
    throw new Error("Missing areaName or areaSlug for community");
  }
  const preferredSlug = slugify(mapped.slug || name);
  const existing = await prisma.community.findFirst({
    where: { organizationId, slug: preferredSlug, deletedAt: null },
    select: { id: true },
  });
  const data = {
    name,
    areaId,
    shortDescription: mapped.shortDescription || null,
    description: mapped.description || null,
    isPublished: autoPublish,
  };
  if (!existing) {
    await prisma.community.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(
          organizationId,
          "community",
          mapped.slug || name,
        ),
        ...data,
      },
    });
    return "imported";
  }
  await prisma.community.update({ where: { id: existing.id }, data });
  return "updated";
}

async function upsertAgent(
  organizationId: string,
  mapped: Record<string, string>,
): Promise<UpsertOutcome> {
  const name = mapped.name;
  if (!name) throw new Error("Missing mapped name");
  const preferredSlug = slugify(mapped.slug || name);
  const existing = await prisma.agent.findFirst({
    where: { organizationId, slug: preferredSlug, deletedAt: null },
    select: { id: true },
  });
  const data = {
    name,
    email: mapped.email || null,
    phone: mapped.phone || null,
    whatsapp: mapped.whatsapp || null,
    title: mapped.title || null,
    bio: mapped.bio || null,
    photoUrl: mapped.photoUrl || null,
    reraNumber: mapped.reraNumber || null,
    isActive: true,
  };
  if (!existing) {
    await prisma.agent.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(organizationId, "agent", mapped.slug || name),
        ...data,
      },
    });
    return "imported";
  }
  await prisma.agent.update({ where: { id: existing.id }, data });
  return "updated";
}

async function upsertAmenity(
  organizationId: string,
  mapped: Record<string, string>,
): Promise<UpsertOutcome> {
  const name = mapped.name;
  if (!name) throw new Error("Missing mapped name");
  const externalId = mapped.externalId || null;
  const preferredSlug = slugify(mapped.slug || name);
  const existing = externalId
    ? await prisma.amenity.findFirst({
        where: { organizationId, externalId, deletedAt: null },
        select: { id: true },
      })
    : await prisma.amenity.findFirst({
        where: { organizationId, slug: preferredSlug, deletedAt: null },
        select: { id: true },
      });
  const data = {
    name,
    icon: mapped.icon || null,
    iconUrl: mapped.iconUrl || null,
    externalId,
  };
  if (!existing) {
    await prisma.amenity.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(organizationId, "amenity", mapped.slug || name),
        ...data,
      },
    });
    return "imported";
  }
  await prisma.amenity.update({
    where: { id: existing.id },
    data: {
      ...data,
      slug: await uniqueSlugFor(
        organizationId,
        "amenity",
        mapped.slug || name,
        existing.id,
      ),
    },
  });
  return "updated";
}

async function upsertProperty(
  organizationId: string,
  sourceKey: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  const name = mapped.name;
  if (!name) throw new Error("Missing mapped name");
  const externalId = externalKey(mapped, `${name}:${mapped.slug}`);
  const preferredSlug = slugify(mapped.slug || name);

  let existing = await prisma.property.findFirst({
    where: {
      organizationId,
      slug: preferredSlug,
      deletedAt: null,
    },
    select: { id: true, details: true },
  });

  if (!existing) {
    existing = await prisma.property.findFirst({
      where: {
        organizationId,
        source: "MANUAL",
        deletedAt: null,
        details: {
          path: ["apiExternalId"],
          equals: externalId,
        },
      },
      select: { id: true, details: true },
    });
  }

  const developerId = await resolveDeveloperId(
    organizationId,
    mapped.developerName,
  );
  const areaId = await resolveAreaId(organizationId, mapped.areaName, undefined, {
    createIfMissing: Boolean(mapped.areaName),
  });
  const details = {
    ...((existing?.details as Record<string, unknown> | null) ?? {}),
    apiExternalId: externalId,
    apiSourceKey: sourceKey,
    ...(mapped.coverUrl ? { coverUrl: mapped.coverUrl } : {}),
  };

  const data = {
    name,
    description: mapped.description || null,
    shortDescription: mapped.shortDescription || null,
    minPrice: asNumber(mapped.minPrice),
    maxPrice: asNumber(mapped.maxPrice),
    currency: mapped.currency || "AED",
    developerId,
    areaId,
    status: autoPublish ? ("PUBLISHED" as const) : ("DRAFT" as const),
    source: "MANUAL" as const,
    details: details as Prisma.InputJsonValue,
    publishedAt: autoPublish ? new Date() : null,
  };

  if (!existing) {
    await prisma.property.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(
          organizationId,
          "property",
          mapped.slug || name,
        ),
        ...data,
      },
    });
    return "imported";
  }
  await prisma.property.update({
    where: { id: existing.id },
    data: {
      ...data,
      slug: await uniqueSlugFor(
        organizationId,
        "property",
        mapped.slug || name,
        existing.id,
      ),
    },
  });
  return "updated";
}

async function upsertCategory(
  organizationId: string,
  mapped: Record<string, string>,
): Promise<UpsertOutcome> {
  const name = mapped.name;
  if (!name) throw new Error("Missing mapped name");
  const preferredSlug = slugify(mapped.slug || name);
  const existing = await prisma.propertyCategory.findFirst({
    where: { organizationId, slug: preferredSlug, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    await prisma.propertyCategory.create({
      data: {
        organizationId,
        name,
        slug: await uniqueSlugFor(
          organizationId,
          "category",
          mapped.slug || name,
        ),
        description: mapped.description || null,
      },
    });
    return "imported";
  }
  await prisma.propertyCategory.update({
    where: { id: existing.id },
    data: { name, description: mapped.description || null },
  });
  return "updated";
}

async function upsertPage(
  organizationId: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  const title = mapped.title;
  if (!title) throw new Error("Missing mapped title");
  const preferredSlug = slugify(mapped.slug || title);
  const existing = await prisma.page.findFirst({
    where: { organizationId, slug: preferredSlug, deletedAt: null },
    select: { id: true, publishedAt: true },
  });
  const data = {
    title,
    excerpt: mapped.excerpt || null,
    body: mapped.body || mapped.content || null,
    workflowState: autoPublish
      ? ("PUBLISHED" as const)
      : ("DRAFT" as const),
    publishedAt: autoPublish ? new Date() : null,
  };
  if (!existing) {
    await prisma.page.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(organizationId, "page", mapped.slug || title),
        kind: "STATIC",
        ...data,
      },
    });
    return "imported";
  }
  await prisma.page.update({
    where: { id: existing.id },
    data: {
      ...data,
      publishedAt: autoPublish
        ? (existing.publishedAt ?? new Date())
        : null,
    },
  });
  return "updated";
}

async function upsertLandingPage(
  organizationId: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  const title = mapped.title;
  if (!title) throw new Error("Missing mapped title");
  const preferredSlug = slugify(mapped.slug || title);
  const existing = await prisma.landingPage.findFirst({
    where: { organizationId, slug: preferredSlug, deletedAt: null },
    select: { id: true, publishedAt: true },
  });
  const data = {
    title,
    campaign: mapped.campaign || null,
    workflowState: autoPublish
      ? ("PUBLISHED" as const)
      : ("DRAFT" as const),
    publishedAt: autoPublish ? new Date() : null,
  };
  if (!existing) {
    await prisma.landingPage.create({
      data: {
        organizationId,
        slug: await uniqueSlugFor(
          organizationId,
          "landingPage",
          mapped.slug || title,
        ),
        ...data,
      },
    });
    return "imported";
  }
  await prisma.landingPage.update({
    where: { id: existing.id },
    data: {
      ...data,
      publishedAt: autoPublish
        ? (existing.publishedAt ?? new Date())
        : null,
    },
  });
  return "updated";
}

async function upsertByTarget(
  target: ApiSourceTarget,
  organizationId: string,
  sourceKey: string,
  mapped: Record<string, string>,
  autoPublish: boolean,
): Promise<UpsertOutcome> {
  switch (target) {
    case "BLOG":
    case "INSIGHT":
      return upsertBlog(organizationId, sourceKey, mapped, autoPublish);
    case "FAQ":
      return upsertFaq(organizationId, sourceKey, mapped);
    case "TESTIMONIAL":
      return upsertTestimonial(organizationId, sourceKey, mapped);
    case "DEVELOPER":
      return upsertDeveloper(organizationId, mapped, autoPublish);
    case "AREA":
      return upsertArea(organizationId, mapped, autoPublish);
    case "COMMUNITY":
      return upsertCommunity(organizationId, mapped, autoPublish);
    case "AGENT":
      return upsertAgent(organizationId, mapped);
    case "AMENITY":
      return upsertAmenity(organizationId, mapped);
    case "PROPERTY":
      return upsertProperty(organizationId, sourceKey, mapped, autoPublish);
    case "CATEGORY":
      return upsertCategory(organizationId, mapped);
    case "PAGE":
      return upsertPage(organizationId, mapped, autoPublish);
    case "LANDING_PAGE":
      return upsertLandingPage(organizationId, mapped, autoPublish);
    default:
      throw new Error(`Unsupported target: ${target}`);
  }
}

function sanitizeSource(row: ApiSource) {
  return {
    id: row.id,
    name: row.name,
    target: row.target,
    method: row.method,
    url: row.url,
    headers: (row.headers as Record<string, string> | null) ?? {},
    authType: row.authType,
    hasAuth: Boolean(row.authValue),
    itemsPath: row.itemsPath,
    fieldMap: (row.fieldMap as ApiFieldMap) ?? {},
    autoPublish: row.autoPublish,
    enabled: row.enabled,
    lastFetchedAt: row.lastFetchedAt,
    lastResult: row.lastResult,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const apiSourceService = {
  defaultFieldMap(target: ApiSourceTarget) {
    return { ...DEFAULT_FIELD_MAPS[target] };
  },

  /**
   * Dev/verify helper: upsert mapped items without HTTP fetch.
   * Only available when VERIFY_API_FETCH=1.
   */
  async syncItemsForVerify(input: {
    target: ApiSourceTarget;
    items: unknown[];
    fieldMap?: ApiFieldMap;
    autoPublish?: boolean;
    sourceKey?: string;
    organizationId?: string;
  }): Promise<ApiSyncResult> {
    if (process.env.VERIFY_API_FETCH !== "1") {
      throw new AppError("VERIFY_API_FETCH is not enabled", { status: 403 });
    }
    const orgId = await resolveOrgId(input.organizationId);
    const fieldMap = input.fieldMap ?? DEFAULT_FIELD_MAPS[input.target];
    const sourceKey = input.sourceKey ?? `api:verify:${input.target.toLowerCase()}`;
    const autoPublish = input.autoPublish ?? true;
    const started = Date.now();
    const result: ApiSyncResult = {
      imported: 0,
      updated: 0,
      skipped: 0,
      fetched: input.items.length,
      errors: [],
      durationMs: 0,
    };

    for (const row of input.items) {
      const mapped = mapRow(row, fieldMap);
      try {
        const outcome = await upsertByTarget(
          input.target,
          orgId,
          sourceKey,
          mapped,
          autoPublish,
        );
        result[outcome] += 1;
      } catch (error) {
        result.errors.push({
          externalId: mapped.externalId,
          message:
            error instanceof Error ? error.message : "Failed to upsert item",
        });
      }
    }
    result.durationMs = Date.now() - started;
    return result;
  },

  async list(organizationId?: string) {
    await requirePermission("cms:blog");
    const orgId = await resolveOrgId(organizationId);
    const rows = await prisma.apiSource.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(sanitizeSource);
  },

  async create(input: ApiSourceInput, organizationId?: string) {
    await requirePermission("cms:blog");
    const orgId = await resolveOrgId(organizationId);
    const row = await prisma.apiSource.create({
      data: {
        organizationId: orgId,
        name: input.name.trim(),
        target: input.target,
        method: (input.method || "GET").toUpperCase(),
        url: input.url.trim(),
        headers: (input.headers ?? {}) as Prisma.InputJsonValue,
        authType: input.authType || "none",
        authValue: input.authValue?.trim() || null,
        itemsPath: input.itemsPath?.trim() || null,
        fieldMap: (Object.keys(input.fieldMap || {}).length
          ? input.fieldMap
          : this.defaultFieldMap(input.target)) as Prisma.InputJsonValue,
        autoPublish: input.autoPublish ?? true,
        enabled: input.enabled ?? true,
      },
    });
    return sanitizeSource(row);
  },

  async update(
    id: string,
    input: Partial<ApiSourceInput>,
    organizationId?: string,
  ) {
    await requirePermission("cms:blog");
    const orgId = await resolveOrgId(organizationId);
    const existing = await prisma.apiSource.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("API source not found", { status: 404 });
    }

    const row = await prisma.apiSource.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name.trim() } : {}),
        ...(input.target != null ? { target: input.target } : {}),
        ...(input.method != null
          ? { method: input.method.toUpperCase() }
          : {}),
        ...(input.url != null ? { url: input.url.trim() } : {}),
        ...(input.headers != null
          ? { headers: input.headers as Prisma.InputJsonValue }
          : {}),
        ...(input.authType != null ? { authType: input.authType } : {}),
        ...(input.authValue !== undefined
          ? { authValue: input.authValue?.trim() || null }
          : {}),
        ...(input.itemsPath !== undefined
          ? { itemsPath: input.itemsPath?.trim() || null }
          : {}),
        ...(input.fieldMap != null
          ? { fieldMap: input.fieldMap as Prisma.InputJsonValue }
          : {}),
        ...(input.autoPublish != null
          ? { autoPublish: input.autoPublish }
          : {}),
        ...(input.enabled != null ? { enabled: input.enabled } : {}),
      },
    });
    return sanitizeSource(row);
  },

  async remove(id: string, organizationId?: string) {
    await requirePermission("cms:blog");
    const orgId = await resolveOrgId(organizationId);
    const existing = await prisma.apiSource.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new AppError("API source not found", { status: 404 });
    }
    await prisma.apiSource.update({
      where: { id },
      data: { deletedAt: new Date(), enabled: false },
    });
    return { ok: true as const };
  },

  async preview(id: string, organizationId?: string) {
    await requirePermission("cms:blog");
    const orgId = await resolveOrgId(organizationId);
    const source = await prisma.apiSource.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!source) {
      throw new AppError("API source not found", { status: 404 });
    }

    const payload = await fetchRemote(source);
    const items = extractItems(payload, source.itemsPath);
    const fieldMap = (source.fieldMap as ApiFieldMap) || {};
    const mapped = items.slice(0, 5).map((row) => mapRow(row, fieldMap));

    return {
      itemCount: items.length,
      sampleKeys:
        items[0] && typeof items[0] === "object"
          ? Object.keys(items[0] as object).slice(0, 40)
          : [],
      mappedPreview: mapped,
      rawPreview: items.slice(0, 2),
    };
  },

  async sync(id: string, organizationId?: string): Promise<ApiSyncResult> {
    if (process.env.VERIFY_API_FETCH !== "1") {
      await requirePermission("cms:blog");
    }
    const orgId = await resolveOrgId(organizationId);
    const source = await prisma.apiSource.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!source) {
      throw new AppError("API source not found", { status: 404 });
    }
    if (!source.enabled) {
      throw new AppError("API source is disabled", { status: 400 });
    }

    const started = Date.now();
    const job = await prisma.syncJob.create({
      data: {
        organizationId: orgId,
        type: "API_IMPORT",
        provider: `api-source:${source.id}`,
        status: "RUNNING",
        startedAt: new Date(),
        payload: {
          sourceId: source.id,
          target: source.target,
          url: source.url,
        },
      },
    });

    const result: ApiSyncResult = {
      imported: 0,
      updated: 0,
      skipped: 0,
      fetched: 0,
      errors: [],
      durationMs: 0,
    };

    const sourceKey = `api:${source.id}`;
    const fieldMap = (source.fieldMap as ApiFieldMap) || {};
    const maxPages = 50;

    try {
      let page = 1;
      let pageCount = 1;

      do {
        const pageUrl =
          page === 1 ? source.url : urlForStrapiPage(source.url, page);
        const payload = await fetchRemote({ ...source, url: pageUrl });
        const items = extractItems(payload, source.itemsPath);

        if (page === 1) {
          result.preview = items.slice(0, 3).map((row) => mapRow(row, fieldMap));
        }

        result.fetched += items.length;

        for (const row of items) {
          const mapped = mapRow(row, fieldMap);
          try {
            const outcome = await upsertByTarget(
              source.target,
              orgId,
              sourceKey,
              mapped,
              source.autoPublish,
            );
            result[outcome] += 1;
          } catch (error) {
            result.errors.push({
              externalId: mapped.externalId,
              message:
                error instanceof Error ? error.message : "Failed to upsert item",
            });
          }
        }

        const pagination = getStrapiPagination(payload);
        if (!pagination || items.length === 0) break;
        pageCount = pagination.pageCount;
        page = pagination.page + 1;
      } while (page <= pageCount && page <= maxPages);

      result.durationMs = Date.now() - started;
      const status =
        result.errors.length === 0
          ? "SUCCESS"
          : result.imported + result.updated > 0
            ? "PARTIAL"
            : "FAILED";

      await prisma.apiSource.update({
        where: { id: source.id },
        data: {
          lastFetchedAt: new Date(),
          lastResult: {
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped,
            fetched: result.fetched,
            errorCount: result.errors.length,
            errors: result.errors.slice(0, 10),
          },
        },
      });

      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status,
          finishedAt: new Date(),
          result: {
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped,
            fetched: result.fetched,
            errorCount: result.errors.length,
          },
          error: result.errors[0]?.message ?? null,
        },
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "API sync failed";
      result.errors.push({ message });
      result.durationMs = Date.now() - started;
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          error: message,
        },
      });
      throw error instanceof AppError
        ? error
        : new AppError(message, { code: "API_SYNC", status: 502 });
    }
  },
};
