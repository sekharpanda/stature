import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type {
  AgentSortOption,
  AgentStatusFilter,
  CreateAgentInput,
  ListAgentsQuery,
  SearchAssignableListingsInput,
  UpdateAgentInput,
} from "@/schemas/agent.schema";

const notDeleted = { deletedAt: null };

const listCount = {
  _count: { select: { properties: { where: { deletedAt: null } } } },
} satisfies Prisma.AgentInclude;

function statusWhere(status: AgentStatusFilter): Prisma.AgentWhereInput {
  switch (status) {
    case "active":
      return { isActive: true };
    case "inactive":
      return { isActive: false };
    case "featured":
      return { isFeatured: true };
    default:
      return {};
  }
}

function searchWhere(q?: string): Prisma.AgentWhereInput {
  if (!q) return {};
  const contains = { contains: q, mode: "insensitive" as const };
  return {
    OR: [
      { name: contains },
      { email: contains },
      { phone: contains },
      { whatsapp: contains },
      { title: contains },
      { reraNumber: contains },
    ],
  };
}

function orderBy(sort: AgentSortOption): Prisma.AgentOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: "asc" }];
    case "listings":
      return [{ properties: { _count: "desc" } }, { name: "asc" }];
    case "recent":
      return [{ createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }];
  }
}

/** Payload the profile form sends for both create and update. */
function writeData(input: CreateAgentInput | UpdateAgentInput) {
  return {
    name: input.name,
    title: input.title,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    bio: input.bio,
    photoUrl: input.photoUrl,
    photoMediaId: input.photoMediaId,
    specialties: input.specialties,
    languages: input.languages,
    serviceAreas: input.serviceAreas,
    reraNumber: input.reraNumber,
    yearsExperience: input.yearsExperience ?? null,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    userId: input.userId ?? null,
  };
}

export const agentRepository = {
  async list(query: ListAgentsQuery) {
    const where: Prisma.AgentWhereInput = {
      organizationId: query.organizationId,
      ...notDeleted,
      ...statusWhere(query.status),
      ...searchWhere(query.q),
    };

    const [items, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy: orderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: listCount,
      }),
      prisma.agent.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  /** Minimal active roster for property assignment selects. */
  async listAssignable(organizationId: string) {
    return prisma.agent.findMany({
      where: { organizationId, ...notDeleted, isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        title: true,
        email: true,
        phone: true,
        whatsapp: true,
        photoUrl: true,
      },
    });
  },

  /** Every non-deleted agent, used by the public display order panel. */
  async listForOrdering(organizationId: string) {
    return prisma.agent.findMany({
      where: { organizationId, ...notDeleted },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        title: true,
        photoUrl: true,
        isActive: true,
        isFeatured: true,
        sortOrder: true,
      },
    });
  },

  async findById(organizationId: string, id: string) {
    return prisma.agent.findFirst({
      where: { id, organizationId, ...notDeleted },
      include: {
        ...listCount,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /** Resolves the owning organization before a mutation is authorized. */
  async findForMutation(id: string) {
    return prisma.agent.findFirst({
      where: { id, ...notDeleted },
      select: {
        id: true,
        organizationId: true,
        name: true,
        slug: true,
        isActive: true,
        isFeatured: true,
      },
    });
  },

  async findBySlug(organizationId: string, slug: string) {
    return prisma.agent.findFirst({
      where: { organizationId, slug, ...notDeleted },
    });
  },

  /** The profile behind a portal login. */
  async findByUserId(userId: string) {
    return prisma.agent.findFirst({
      where: { userId, ...notDeleted },
      include: {
        ...listCount,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  /** Applies an approved profile edit. Only the agent-editable fields. */
  async applyProfilePatch(
    id: string,
    patch: {
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      bio?: string | null;
      photoUrl?: string | null;
      photoMediaId?: string | null;
      languages?: string[];
      specialties?: string[];
      serviceAreas?: string[];
      reraNumber?: string | null;
      yearsExperience?: number | null;
    },
  ) {
    return prisma.agent.update({ where: { id }, data: patch });
  },

  async linkUser(id: string, userId: string | null) {
    return prisma.agent.update({ where: { id }, data: { userId } });
  },

  /** Public profile page: active agents only, with their published inventory. */
  async findPublicBySlug(organizationId: string, slug: string) {
    return prisma.agent.findFirst({
      where: { organizationId, slug, ...notDeleted, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        bio: true,
        email: true,
        phone: true,
        whatsapp: true,
        photoUrl: true,
        languages: true,
        specialties: true,
        serviceAreas: true,
        reraNumber: true,
        yearsExperience: true,
        metaTitle: true,
        metaDescription: true,
        updatedAt: true,
        _count: {
          select: {
            properties: { where: { deletedAt: null, status: "PUBLISHED" } },
          },
        },
      },
    });
  },

  /** Cards on /our-team and the homepage team strip. */
  async listPublicRoster(organizationId: string) {
    return prisma.agent.findMany({
      where: { organizationId, ...notDeleted, isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        photoUrl: true,
        whatsapp: true,
        languages: true,
      },
    });
  },

  /** Slugs behind /our-team/[slug], used for the sitemap and static params. */
  async listPublicProfiles(organizationId: string) {
    return prisma.agent.findMany({
      where: { organizationId, ...notDeleted, isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { slug: true, updatedAt: true },
    });
  },

  /** Includes soft-deleted rows because the slug unique index still holds them. */
  async slugTaken(organizationId: string, slug: string, excludeId?: string) {
    const existing = await prisma.agent.findFirst({
      where: {
        organizationId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(existing);
  },

  async summary(organizationId: string) {
    const [total, active, featured, unassignedListings] = await Promise.all([
      prisma.agent.count({ where: { organizationId, ...notDeleted } }),
      prisma.agent.count({
        where: { organizationId, ...notDeleted, isActive: true },
      }),
      prisma.agent.count({
        where: { organizationId, ...notDeleted, isFeatured: true },
      }),
      prisma.property.count({
        where: { organizationId, ...notDeleted, agentId: null },
      }),
    ]);
    return { total, active, featured, unassignedListings };
  },

  async create(input: CreateAgentInput, slug: string) {
    return prisma.agent.create({
      data: {
        organizationId: input.organizationId,
        slug,
        ...writeData(input),
        isActive: input.isActive ?? true,
        isFeatured: input.isFeatured ?? false,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  },

  async update(id: string, input: UpdateAgentInput, slug: string) {
    return prisma.agent.update({
      where: { id },
      data: {
        slug,
        ...writeData(input),
        ...(input.isActive == null ? {} : { isActive: input.isActive }),
        ...(input.isFeatured == null ? {} : { isFeatured: input.isFeatured }),
        ...(input.sortOrder == null ? {} : { sortOrder: input.sortOrder }),
      },
    });
  },

  async setVisibility(
    id: string,
    patch: { isActive?: boolean; isFeatured?: boolean },
  ) {
    return prisma.agent.update({
      where: { id },
      data: {
        ...(patch.isActive == null ? {} : { isActive: patch.isActive }),
        ...(patch.isFeatured == null ? {} : { isFeatured: patch.isFeatured }),
      },
    });
  },

  async reorder(organizationId: string, orderedAgentIds: string[]) {
    const owned = await prisma.agent.findMany({
      where: { organizationId, ...notDeleted, id: { in: orderedAgentIds } },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((agent) => agent.id));
    const ordered = orderedAgentIds.filter((id) => ownedIds.has(id));

    await prisma.$transaction(
      ordered.map((id, index) =>
        prisma.agent.update({ where: { id }, data: { sortOrder: index } }),
      ),
    );

    return { updated: ordered.length };
  },

  /**
   * Soft delete with an explicit handover: listings either move to another
   * agent or fall back to unassigned so no property keeps a hidden agent.
   */
  async softDelete(
    organizationId: string,
    id: string,
    reassignToAgentId: string | null,
  ) {
    return prisma.$transaction(async (tx) => {
      const moved = await tx.property.updateMany({
        where: { organizationId, agentId: id },
        data: { agentId: reassignToAgentId },
      });
      const agent = await tx.agent.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false, isFeatured: false },
      });
      return { agent, movedListings: moved.count };
    });
  },

  async listListings(
    organizationId: string,
    agentId: string,
    { page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {},
  ) {
    const where: Prisma.PropertyWhereInput = {
      organizationId,
      agentId,
      ...notDeleted,
    };
    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          minPrice: true,
          currency: true,
          city: { select: { name: true } },
          area: { select: { name: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async listingBreakdown(organizationId: string, agentId: string) {
    const rows = await prisma.property.groupBy({
      by: ["status"],
      where: { organizationId, agentId, ...notDeleted },
      _count: { _all: true },
    });
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});
  },

  /** Candidate listings for the assignment picker. */
  async searchAssignableListings(input: SearchAssignableListingsInput) {
    const contains = input.q
      ? { contains: input.q, mode: "insensitive" as const }
      : undefined;

    return prisma.property.findMany({
      where: {
        organizationId: input.organizationId,
        ...notDeleted,
        agentId:
          input.scope === "unassigned" ? null : { not: input.agentId },
        ...(contains
          ? { OR: [{ name: contains }, { slug: contains }] }
          : {}),
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: input.take,
      select: {
        id: true,
        name: true,
        status: true,
        minPrice: true,
        currency: true,
        city: { select: { name: true } },
        area: { select: { name: true } },
        agent: { select: { id: true, name: true } },
      },
    });
  },

  async assignListings(
    organizationId: string,
    agentId: string | null,
    propertyIds: string[],
  ) {
    const result = await prisma.property.updateMany({
      where: { organizationId, ...notDeleted, id: { in: propertyIds } },
      data: { agentId },
    });
    return { updated: result.count };
  },

  async unassignListings(
    organizationId: string,
    agentId: string,
    propertyIds: string[],
  ) {
    const result = await prisma.property.updateMany({
      where: { organizationId, agentId, id: { in: propertyIds } },
      data: { agentId: null },
    });
    return { updated: result.count };
  },
};
