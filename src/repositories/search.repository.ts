import { prisma } from "@/lib/db";

export type SearchGroupKey =
  | "properties"
  | "developers"
  | "communities"
  | "areas"
  | "blogs"
  | "leads"
  | "users";

export type SearchHit = {
  id: string;
  group: SearchGroupKey;
  title: string;
  subtitle?: string | null;
  href: string;
};

const TAKE = 5;

export const searchRepository = {
  async globalSearch(
    organizationId: string,
    query: string,
  ): Promise<SearchHit[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const contains = { contains: q, mode: "insensitive" as const };
    const base = { organizationId, deletedAt: null };

    const [properties, developers, communities, areas, blogs, leads, users] =
      await Promise.all([
        prisma.property.findMany({
          where: { ...base, name: contains },
          select: { id: true, name: true, slug: true, status: true },
          take: TAKE,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.developer.findMany({
          where: { ...base, name: contains },
          select: { id: true, name: true, slug: true },
          take: TAKE,
          orderBy: { name: "asc" },
        }),
        prisma.community.findMany({
          where: { ...base, name: contains },
          select: { id: true, name: true, slug: true },
          take: TAKE,
          orderBy: { name: "asc" },
        }),
        prisma.area.findMany({
          where: { ...base, name: contains },
          select: { id: true, name: true, slug: true },
          take: TAKE,
          orderBy: { name: "asc" },
        }),
        prisma.blogPost.findMany({
          where: { ...base, title: contains },
          select: { id: true, title: true, slug: true, workflowState: true },
          take: TAKE,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.lead.findMany({
          where: {
            ...base,
            OR: [{ name: contains }, { email: contains }, { phone: contains }],
          },
          select: { id: true, name: true, email: true, phone: true, status: true },
          take: TAKE,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          where: {
            organizationId,
            deletedAt: null,
            OR: [{ name: contains }, { email: contains }],
          },
          select: { id: true, name: true, email: true },
          take: TAKE,
          orderBy: { name: "asc" },
        }),
      ]);

    return [
      ...properties.map((p) => ({
        id: p.id,
        group: "properties" as const,
        title: p.name,
        subtitle: p.status,
        href: `/admin/properties/${p.id}`,
      })),
      ...developers.map((d) => ({
        id: d.id,
        group: "developers" as const,
        title: d.name,
        subtitle: d.slug,
        href: `/admin/developers/${d.id}`,
      })),
      ...communities.map((c) => ({
        id: c.id,
        group: "communities" as const,
        title: c.name,
        subtitle: c.slug,
        href: `/admin/communities/${c.id}`,
      })),
      ...areas.map((a) => ({
        id: a.id,
        group: "areas" as const,
        title: a.name,
        subtitle: a.slug,
        href: `/admin/areas`,
      })),
      ...blogs.map((b) => ({
        id: b.id,
        group: "blogs" as const,
        title: b.title,
        subtitle: b.workflowState,
        href: `/admin/blog/${b.id}`,
      })),
      ...leads.map((l) => ({
        id: l.id,
        group: "leads" as const,
        title: l.name,
        subtitle: l.email ?? l.phone ?? l.status,
        href: `/admin/leads/${l.id}`,
      })),
      ...users.map((u) => ({
        id: u.id,
        group: "users" as const,
        title: u.name,
        subtitle: u.email,
        href: `/admin/users`,
      })),
    ];
  },
};
