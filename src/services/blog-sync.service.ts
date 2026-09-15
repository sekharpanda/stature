import { createHash } from "crypto";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import {
  fetchBlogPage,
  getBlogApiConfig,
  isBlogApiReady,
  type BlogApiConfig,
} from "@/providers/blog";
import type { CanonicalBlogPost } from "@/providers/blog";
import { organizationRepository } from "@/repositories/organization.repository";

export type BlogSyncResult = {
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ externalId?: string; message: string }>;
  durationMs: number;
  jobId?: string;
  provider: string;
  fetched: number;
};

export type BlogSyncOverrides = {
  baseUrl?: string;
  provider?: string;
  apiKey?: string;
  autoPublish?: boolean;
  maxPages?: number;
};

function hashContent(post: CanonicalBlogPost) {
  return createHash("sha256")
    .update(
      [
        post.title,
        post.slug,
        post.excerpt ?? "",
        post.content,
        post.coverUrl ?? "",
        post.canonicalUrl ?? "",
        post.publishedAt?.toISOString() ?? "",
      ].join("\n"),
    )
    .digest("hex");
}

function withCover(content: string, coverUrl: string | null) {
  const body = content.trim();
  if (!coverUrl?.trim()) return body || null;
  return `<!--cover:${coverUrl.trim()}-->\n${body}`;
}

async function resolveUniqueSlug(
  organizationId: string,
  preferred: string,
  excludeId?: string,
) {
  const base = slugify(preferred) || "post";
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        organizationId,
        slug: candidate,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

async function upsertPost(
  organizationId: string,
  source: string,
  post: CanonicalBlogPost,
  autoPublish: boolean,
): Promise<"imported" | "updated" | "skipped"> {
  const contentHash = hashContent(post);
  const existing = await prisma.blogPost.findFirst({
    where: {
      organizationId,
      source,
      externalId: post.externalId,
      deletedAt: null,
    },
    select: {
      id: true,
      contentHash: true,
      slug: true,
      workflowState: true,
      publishedAt: true,
    },
  });

  if (existing?.contentHash === contentHash) {
    return "skipped";
  }

  const content = withCover(post.content, post.coverUrl);
  const publishNow = autoPublish;

  if (!existing) {
    const slug = await resolveUniqueSlug(organizationId, post.slug);
    await prisma.blogPost.create({
      data: {
        organizationId,
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        canonicalUrl: post.canonicalUrl,
        source,
        externalId: post.externalId,
        contentHash,
        workflowState: publishNow ? "PUBLISHED" : "DRAFT",
        publishedAt: publishNow
          ? (post.publishedAt ?? new Date())
          : null,
      },
    });
    return "imported";
  }

  const slug =
    existing.slug === post.slug
      ? existing.slug
      : await resolveUniqueSlug(organizationId, post.slug, existing.id);

  await prisma.blogPost.update({
    where: { id: existing.id },
    data: {
      title: post.title,
      slug,
      excerpt: post.excerpt,
      content,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      canonicalUrl: post.canonicalUrl,
      contentHash,
      ...(publishNow
        ? {
            workflowState: "PUBLISHED" as const,
            publishedAt:
              existing.publishedAt ?? post.publishedAt ?? new Date(),
          }
        : {}),
    },
  });
  return "updated";
}

export const blogSyncService = {
  getStatus(overrides?: BlogSyncOverrides) {
    const config = getBlogApiConfig(overrides);
    return {
      enabled: config.enabled,
      configured: config.configured,
      provider: config.provider,
      baseUrl: config.baseUrl,
      hasApiKey: Boolean(config.apiKey),
      autoPublish: config.autoPublish,
    };
  },

  async getOverview(organizationId?: string, overrides?: BlogSyncOverrides) {
    await requirePermission("cms:blog");
    let orgId = organizationId;
    if (!orgId) {
      const org = await organizationRepository.getDefault();
      if (!org) {
        throw new AppError("Organization not configured", { status: 500 });
      }
      orgId = org.id;
    }

    const [total, published, synced, lastJob] = await Promise.all([
      prisma.blogPost.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
      prisma.blogPost.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          workflowState: "PUBLISHED",
        },
      }),
      prisma.blogPost.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          source: { not: "manual" },
          externalId: { not: null },
        },
      }),
      prisma.syncJob.findFirst({
        where: {
          organizationId: orgId,
          type: "BLOG_IMPORT",
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      connection: this.getStatus(overrides),
      counts: { total, published, synced },
      lastJob,
    };
  },

  async syncAll(
    input?: BlogSyncOverrides & { organizationId?: string },
  ): Promise<BlogSyncResult> {
    await requirePermission("cms:blog");

    const config: BlogApiConfig = getBlogApiConfig(input);
    if (!isBlogApiReady(config)) {
      throw new AppError(
        "Blog API is not configured. Set BLOG_API_BASE_URL or paste a URL in Admin → API Fetch.",
        { code: "BLOG_API_CONFIG", status: 503 },
      );
    }

    let orgId = input?.organizationId;
    if (!orgId) {
      const org = await organizationRepository.getDefault();
      if (!org) {
        throw new AppError("Organization not configured", { status: 500 });
      }
      orgId = org.id;
    }

    const running = await prisma.syncJob.findFirst({
      where: {
        organizationId: orgId,
        type: "BLOG_IMPORT",
        status: "RUNNING",
        deletedAt: null,
        startedAt: { gte: new Date(Date.now() - 60 * 60_000) },
      },
      select: { id: true },
    });
    if (running) {
      return {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [{ message: "Blog sync already running" }],
        durationMs: 0,
        jobId: running.id,
        provider: config.provider,
        fetched: 0,
      };
    }

    const maxPages = Math.min(Math.max(input?.maxPages ?? 10, 1), 50);
    const source = config.provider;
    const started = Date.now();

    const job = await prisma.syncJob.create({
      data: {
        organizationId: orgId,
        type: "BLOG_IMPORT",
        provider: source,
        status: "RUNNING",
        startedAt: new Date(),
        payload: {
          baseUrl: config.baseUrl,
          provider: config.provider,
          autoPublish: config.autoPublish,
          maxPages,
        },
      },
    });

    const result: BlogSyncResult = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      durationMs: 0,
      jobId: job.id,
      provider: config.provider,
      fetched: 0,
    };

    try {
      for (let page = 1; page <= maxPages; page += 1) {
        const batch = await fetchBlogPage(config, { page, perPage: 20 });
        result.fetched += batch.posts.length;

        for (const post of batch.posts) {
          try {
            const outcome = await upsertPost(
              orgId,
              source,
              post,
              config.autoPublish,
            );
            result[outcome] += 1;
          } catch (error) {
            result.errors.push({
              externalId: post.externalId,
              message:
                error instanceof Error ? error.message : "Upsert failed",
            });
          }
        }

        if (!batch.hasMore || batch.posts.length === 0) break;
      }

      result.durationMs = Date.now() - started;
      const status =
        result.errors.length === 0
          ? "SUCCESS"
          : result.imported + result.updated > 0
            ? "PARTIAL"
            : "FAILED";

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
            errors: result.errors.slice(0, 20),
            durationMs: result.durationMs,
          },
          error:
            result.errors[0]?.message && status !== "SUCCESS"
              ? result.errors[0].message
              : null,
        },
      });

      return result;
    } catch (error) {
      result.durationMs = Date.now() - started;
      const message =
        error instanceof Error ? error.message : "Blog sync failed";
      result.errors.push({ message });
      await prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          error: message,
          result: {
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped,
            fetched: result.fetched,
            errorCount: result.errors.length,
          },
        },
      });
      throw error instanceof AppError
        ? error
        : new AppError(message, { code: "BLOG_SYNC", status: 502 });
    }
  },
};
