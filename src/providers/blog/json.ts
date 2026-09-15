import { slugify } from "@/lib/utils";

import type { BlogFetchResult, BlogProviderContext, CanonicalBlogPost } from "./types";

type LoosePost = Record<string, unknown>;

function asString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function pickString(row: LoosePost, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return "";
}

function mapJsonPost(row: LoosePost, index: number): CanonicalBlogPost | null {
  const title = pickString(row, ["title", "name", "headline"]);
  if (!title) return null;

  const externalId =
    pickString(row, ["id", "externalId", "uuid", "guid"]) || `row-${index + 1}`;
  const slugRaw = pickString(row, ["slug", "permalink", "path"]);
  const content = pickString(row, ["content", "body", "html", "description"]);
  const excerpt =
    pickString(row, ["excerpt", "summary", "subtitle"]).slice(0, 400) || null;
  const coverUrl =
    pickString(row, [
      "coverUrl",
      "cover",
      "image",
      "featuredImage",
      "thumbnail",
      "ogImage",
    ]) || null;
  const publishedRaw = pickString(row, [
    "publishedAt",
    "published_at",
    "date",
    "createdAt",
  ]);
  const publishedAt = publishedRaw ? new Date(publishedRaw) : null;
  const canonicalUrl =
    pickString(row, ["canonicalUrl", "url", "link", "permalink"]) || null;

  return {
    externalId,
    title,
    slug: slugify(slugRaw || title) || `post-${externalId}`,
    excerpt,
    content,
    coverUrl,
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    canonicalUrl,
    metaTitle: pickString(row, ["metaTitle", "seoTitle"]) || null,
    metaDescription:
      pickString(row, ["metaDescription", "seoDescription"]) || excerpt,
  };
}

function extractArray(payload: unknown): LoosePost[] {
  if (Array.isArray(payload)) return payload as LoosePost[];
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ["posts", "data", "items", "results", "articles"]) {
    if (Array.isArray(obj[key])) return obj[key] as LoosePost[];
  }
  return [];
}

export async function fetchJsonPosts(
  ctx: BlogProviderContext,
  options: { page?: number; perPage?: number } = {},
): Promise<BlogFetchResult> {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 50;
  const url = new URL(ctx.baseUrl);
  if (!url.searchParams.has("page")) {
    url.searchParams.set("page", String(page));
  }
  if (!url.searchParams.has("per_page") && !url.searchParams.has("limit")) {
    url.searchParams.set("limit", String(perPage));
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (ctx.apiKey) {
    headers.Authorization = `Bearer ${ctx.apiKey}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Blog JSON API ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    );
  }

  const payload = await res.json();
  const rows = extractArray(payload);
  const posts = rows
    .map((row, i) => mapJsonPost(row, i))
    .filter((p): p is CanonicalBlogPost => Boolean(p));

  // Generic JSON endpoints usually return one page; stop after first unless caller paginates via URL.
  return {
    posts,
    page,
    hasMore: false,
    total: posts.length,
  };
}
