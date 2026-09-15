import { slugify } from "@/lib/utils";

import type { BlogFetchResult, BlogProviderContext, CanonicalBlogPost } from "./types";

type WpRendered = { rendered?: string; protected?: boolean };

type WpPost = {
  id: number | string;
  slug?: string;
  link?: string;
  date?: string;
  modified?: string;
  title?: WpRendered | string;
  content?: WpRendered | string;
  excerpt?: WpRendered | string;
  jetpack_featured_media_url?: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
    og_image?: Array<{ url?: string }>;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: { sizes?: Record<string, { source_url?: string }> };
    }>;
  };
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function rendered(value: WpRendered | string | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.rendered ?? "";
}

function coverFromPost(post: WpPost): string | null {
  const jetpack = post.jetpack_featured_media_url?.trim();
  if (jetpack) return jetpack;

  const yoast = post.yoast_head_json?.og_image?.[0]?.url?.trim();
  if (yoast) return yoast;

  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const large =
    media?.media_details?.sizes?.large?.source_url ||
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.source_url;
  return large?.trim() || null;
}

function mapWpPost(post: WpPost): CanonicalBlogPost | null {
  const title = stripHtml(rendered(post.title));
  if (!title) return null;

  const contentHtml = rendered(post.content).trim();
  const excerptRaw = rendered(post.excerpt);
  const excerpt = stripHtml(excerptRaw).slice(0, 400) || null;
  const slugBase = post.slug?.trim() || slugify(title);
  const publishedAt = post.date ? new Date(post.date) : null;

  return {
    externalId: String(post.id),
    title,
    slug: slugify(slugBase) || `post-${post.id}`,
    excerpt,
    content: contentHtml,
    coverUrl: coverFromPost(post),
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    canonicalUrl: post.link?.trim() || null,
    metaTitle: post.yoast_head_json?.title?.trim() || null,
    metaDescription: post.yoast_head_json?.description?.trim() || excerpt,
  };
}

function listEndpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.includes("/wp-json/")) return trimmed;
  return `${trimmed}/wp-json/wp/v2/posts`;
}

export async function fetchWordPressPosts(
  ctx: BlogProviderContext,
  options: { page?: number; perPage?: number } = {},
): Promise<BlogFetchResult> {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 20;
  const url = new URL(listEndpoint(ctx.baseUrl));
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("_embed", "1");
  url.searchParams.set("status", "publish");

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
      `WordPress API ${res.status}: ${body.slice(0, 200) || res.statusText}`,
    );
  }

  const data = (await res.json()) as WpPost[] | { data?: WpPost[] };
  const rows = Array.isArray(data) ? data : (data.data ?? []);
  const totalHeader = res.headers.get("X-WP-Total");
  const totalPagesHeader = res.headers.get("X-WP-TotalPages");
  const total = totalHeader ? Number(totalHeader) : undefined;
  const totalPages = totalPagesHeader ? Number(totalPagesHeader) : undefined;

  const posts = rows
    .map(mapWpPost)
    .filter((p): p is CanonicalBlogPost => Boolean(p));

  return {
    posts,
    page,
    hasMore:
      totalPages != null
        ? page < totalPages
        : posts.length >= perPage,
    total,
  };
}
