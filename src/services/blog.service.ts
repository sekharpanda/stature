import { prisma } from "@/lib/db";

function parseCover(content: string | null | undefined) {
  if (!content) return { coverUrl: null as string | null, body: "" };
  const match = content.match(/^<!--cover:(.*?)-->\n?([\s\S]*)$/);
  if (!match) return { coverUrl: null, body: content };
  return { coverUrl: match[1]?.trim() || null, body: match[2] ?? "" };
}

/** Rounded up from 200 words per minute, ignoring markup. */
function readingMinutes(html: string | null | undefined) {
  if (!html) return null;
  const words = html
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (words === 0) return null;
  return Math.max(1, Math.ceil(words / 200));
}

export type PublicBlogListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: Date | null;
  readingMinutes: number | null;
};

export type PublicBlogDetail = PublicBlogListItem & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
};

export const blogService = {
  async listPublished(organizationId: string, page = 1, pageSize = 12) {
    const where = {
      organizationId,
      deletedAt: null,
      workflowState: "PUBLISHED" as const,
    };

    const [total, rows] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          publishedAt: true,
        },
      }),
    ]);

    const items: PublicBlogListItem[] = rows.map((row) => {
      const { coverUrl, body } = parseCover(row.content);
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        coverUrl,
        publishedAt: row.publishedAt,
        readingMinutes: readingMinutes(body),
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async getPublishedBySlug(
    organizationId: string,
    slug: string,
  ): Promise<PublicBlogDetail | null> {
    const row = await prisma.blogPost.findFirst({
      where: {
        organizationId,
        slug,
        deletedAt: null,
        workflowState: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        metaTitle: true,
        metaDescription: true,
        canonicalUrl: true,
      },
    });
    if (!row) return null;
    const { coverUrl, body } = parseCover(row.content);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      coverUrl,
      publishedAt: row.publishedAt,
      readingMinutes: readingMinutes(body),
      content: body,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      canonicalUrl: row.canonicalUrl,
    };
  },
};
