import {
  normalizePageContent,
  type StaticPageContent,
} from "@/config/page-content-defaults";
import { RESERVED_PUBLIC_SLUGS } from "@/config/site-chrome-defaults";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { WorkflowState } from "@prisma/client";

const EMPTY_PAGE: StaticPageContent = {
  eyebrow: "",
  title: "",
  lede: "",
  blocks: [],
};

export function slugifyPagePath(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/");
}

export function isReservedPublicSlug(slug: string) {
  const first = slug.split("/")[0] ?? slug;
  return (RESERVED_PUBLIC_SLUGS as readonly string[]).includes(first);
}

function contentFromPage(schemaJson: unknown, title: string): StaticPageContent {
  const raw =
    schemaJson && typeof schemaJson === "object" && !Array.isArray(schemaJson)
      ? (schemaJson as Partial<StaticPageContent>)
      : {};
  return normalizePageContent(
    { ...raw, title: raw.title || title },
    { ...EMPTY_PAGE, title },
  );
}

export const customPageService = {
  async list(organizationId: string) {
    return prisma.page.findMany({
      where: { organizationId, kind: "STATIC", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        workflowState: true,
        publishedAt: true,
        updatedAt: true,
        metaTitle: true,
        metaDescription: true,
      },
    });
  },

  async getById(organizationId: string, id: string) {
    const page = await prisma.page.findFirst({
      where: { id, organizationId, kind: "STATIC", deletedAt: null },
    });
    if (!page) return null;
    return {
      ...page,
      content: contentFromPage(page.schemaJson, page.title),
    };
  },

  async getPublishedBySlug(organizationId: string, slug: string) {
    const page = await prisma.page.findFirst({
      where: {
        organizationId,
        slug,
        kind: "STATIC",
        workflowState: "PUBLISHED",
        deletedAt: null,
      },
    });
    if (!page) return null;
    return {
      ...page,
      content: contentFromPage(page.schemaJson, page.title),
    };
  },

  async create(
    organizationId: string,
    input: {
      title: string;
      slug: string;
      excerpt?: string;
      metaTitle?: string;
      metaDescription?: string;
      content: StaticPageContent;
      publish?: boolean;
    },
  ) {
    const slug = slugifyPagePath(input.slug || input.title);
    if (!slug) {
      throw new AppError("Enter a URL slug", { status: 422 });
    }
    if (isReservedPublicSlug(slug)) {
      throw new AppError("That URL is already used by the site", {
        status: 409,
      });
    }

    const existing = await prisma.page.findFirst({
      where: { organizationId, slug, deletedAt: null },
    });
    if (existing) {
      throw new AppError("A page with this URL already exists", {
        status: 409,
      });
    }

    const content = normalizePageContent(input.content, {
      ...EMPTY_PAGE,
      title: input.title,
    });

    return prisma.page.create({
      data: {
        organizationId,
        kind: "STATIC",
        title: input.title.trim(),
        slug,
        excerpt: input.excerpt?.trim() || null,
        metaTitle: input.metaTitle?.trim() || null,
        metaDescription: input.metaDescription?.trim() || null,
        schemaJson: content,
        workflowState: input.publish ? "PUBLISHED" : "DRAFT",
        publishedAt: input.publish ? new Date() : null,
      },
    });
  },

  async update(
    organizationId: string,
    id: string,
    input: {
      title: string;
      slug: string;
      excerpt?: string;
      metaTitle?: string;
      metaDescription?: string;
      content: StaticPageContent;
      workflowState?: WorkflowState;
    },
  ) {
    const current = await prisma.page.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!current) {
      throw new AppError("Page not found", { status: 404 });
    }

    const slug = slugifyPagePath(input.slug || input.title);
    if (!slug) {
      throw new AppError("Enter a URL slug", { status: 422 });
    }
    if (isReservedPublicSlug(slug)) {
      throw new AppError("That URL is already used by the site", {
        status: 409,
      });
    }

    const clash = await prisma.page.findFirst({
      where: {
        organizationId,
        slug,
        deletedAt: null,
        NOT: { id },
      },
    });
    if (clash) {
      throw new AppError("A page with this URL already exists", {
        status: 409,
      });
    }

    const content = normalizePageContent(input.content, {
      ...EMPTY_PAGE,
      title: input.title,
    });
    const workflowState = input.workflowState ?? current.workflowState;

    return prisma.page.update({
      where: { id },
      data: {
        title: input.title.trim(),
        slug,
        excerpt: input.excerpt?.trim() || null,
        metaTitle: input.metaTitle?.trim() || null,
        metaDescription: input.metaDescription?.trim() || null,
        schemaJson: content,
        workflowState,
        publishedAt:
          workflowState === "PUBLISHED"
            ? current.publishedAt ?? new Date()
            : current.publishedAt,
      },
    });
  },

  async remove(organizationId: string, id: string) {
    const current = await prisma.page.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!current) {
      throw new AppError("Page not found", { status: 404 });
    }
    await prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
