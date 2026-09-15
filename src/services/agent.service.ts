import { Prisma } from "@prisma/client";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { agentRepository } from "@/repositories/agent.repository";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  assignAgentListingsSchema,
  createAgentSchema,
  deleteAgentSchema,
  listAgentsQuerySchema,
  reorderAgentsSchema,
  searchAssignableListingsSchema,
  setAgentVisibilitySchema,
  unassignAgentListingsSchema,
  updateAgentSchema,
} from "@/schemas/agent.schema";

async function audit(
  organizationId: string,
  userId: string | undefined,
  action: string,
  agentId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.activityLog.create({
    data: {
      organizationId,
      userId: userId ?? null,
      action,
      entityType: "Agent",
      entityId: agentId,
      ...(metadata ? { metadata } : {}),
    },
  });
}

async function uniqueSlug(
  organizationId: string,
  desired: string,
  excludeId?: string,
) {
  const base = slugify(desired) || "agent";
  let candidate = base;
  let suffix = 2;
  while (await agentRepository.slugTaken(organizationId, candidate, excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/** Turns Prisma unique-constraint noise into messages an admin can act on. */
function rethrowConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = String(error.meta?.target ?? "");
    if (target.includes("userId")) {
      throw new AppError(
        "That login is already linked to another agent profile.",
        { code: "CONFLICT", status: 409 },
      );
    }
    throw new AppError("An agent with that slug already exists.", {
      code: "CONFLICT",
      status: 409,
    });
  }
  throw error;
}

async function requireAgent(id: string) {
  const agent = await agentRepository.findForMutation(id);
  if (!agent) throw new NotFoundError("Agent not found");
  return agent;
}

export const agentService = {
  async list(raw: unknown) {
    return agentRepository.list(listAgentsQuerySchema.parse(raw));
  },

  async get(organizationId: string, id: string) {
    const agent = await agentRepository.findById(organizationId, id);
    if (!agent) throw new NotFoundError("Agent not found");
    return agent;
  },

  /** Public roster, resolved against the default organization. */
  async listPublicRoster() {
    const org = await organizationRepository.getDefault();
    if (!org) return [];
    return agentRepository.listPublicRoster(org.id);
  },

  async getPublicProfile(slug: string) {
    const org = await organizationRepository.getDefault();
    if (!org) return null;
    const agent = await agentRepository.findPublicBySlug(org.id, slug);
    return agent ? { ...agent, organizationId: org.id } : null;
  },

  async listPublicProfiles() {
    const org = await organizationRepository.getDefault();
    if (!org) return [];
    return agentRepository.listPublicProfiles(org.id);
  },

  listAssignable(organizationId: string) {
    return agentRepository.listAssignable(organizationId);
  },

  listForOrdering(organizationId: string) {
    return agentRepository.listForOrdering(organizationId);
  },

  summary(organizationId: string) {
    return agentRepository.summary(organizationId);
  },

  listListings(
    organizationId: string,
    agentId: string,
    options?: { page?: number; pageSize?: number },
  ) {
    return agentRepository.listListings(organizationId, agentId, options);
  },

  listingBreakdown(organizationId: string, agentId: string) {
    return agentRepository.listingBreakdown(organizationId, agentId);
  },

  async searchAssignableListings(raw: unknown) {
    await requirePermission("agent:manage");
    return agentRepository.searchAssignableListings(
      searchAssignableListingsSchema.parse(raw),
    );
  },

  async create(raw: unknown) {
    const session = await requirePermission("agent:manage");
    const input = createAgentSchema.parse(raw);
    const slug = await uniqueSlug(
      input.organizationId,
      input.slug || input.name,
    );

    try {
      const agent = await agentRepository.create(input, slug);
      await audit(
        agent.organizationId,
        session.user?.id,
        "agent.created",
        agent.id,
        { name: agent.name, slug: agent.slug },
      );
      return agent;
    } catch (error) {
      rethrowConflict(error);
    }
  },

  async update(raw: unknown) {
    const session = await requirePermission("agent:manage");
    const input = updateAgentSchema.parse(raw);
    const existing = await requireAgent(input.id);
    const slug =
      input.slug && input.slug !== existing.slug
        ? await uniqueSlug(existing.organizationId, input.slug, existing.id)
        : existing.slug;

    try {
      const agent = await agentRepository.update(existing.id, input, slug);
      await audit(
        existing.organizationId,
        session.user?.id,
        "agent.updated",
        agent.id,
        { name: agent.name, slug: agent.slug },
      );
      return agent;
    } catch (error) {
      rethrowConflict(error);
    }
  },

  async setVisibility(raw: unknown) {
    const session = await requirePermission("agent:manage");
    const input = setAgentVisibilitySchema.parse(raw);
    const existing = await requireAgent(input.id);
    const agent = await agentRepository.setVisibility(existing.id, input);
    await audit(
      existing.organizationId,
      session.user?.id,
      agent.isActive ? "agent.activated" : "agent.deactivated",
      agent.id,
      { isActive: agent.isActive, isFeatured: agent.isFeatured },
    );
    return agent;
  },

  async reorder(raw: unknown) {
    const session = await requirePermission("agent:manage");
    const input = reorderAgentsSchema.parse(raw);
    const result = await agentRepository.reorder(
      input.organizationId,
      input.orderedAgentIds,
    );
    await audit(
      input.organizationId,
      session.user?.id,
      "agent.reordered",
      input.orderedAgentIds[0] ?? "none",
      { count: result.updated },
    );
    return result;
  },

  async remove(raw: unknown) {
    const session = await requirePermission("agent:manage");
    const input = deleteAgentSchema.parse(raw);
    const existing = await requireAgent(input.id);

    const reassignTo = input.reassignToAgentId ?? null;
    if (reassignTo) {
      if (reassignTo === existing.id) {
        throw new AppError("Choose a different agent to receive the listings.", {
          code: "VALIDATION",
        });
      }
      const target = await agentRepository.findForMutation(reassignTo);
      if (!target || target.organizationId !== existing.organizationId) {
        throw new NotFoundError("Replacement agent not found");
      }
    }

    const result = await agentRepository.softDelete(
      existing.organizationId,
      existing.id,
      reassignTo,
    );
    await audit(
      existing.organizationId,
      session.user?.id,
      "agent.deleted",
      existing.id,
      { movedListings: result.movedListings, reassignedTo: reassignTo },
    );
    return result;
  },

  async assignListings(raw: unknown) {
    const session = await requirePermission("agent:manage");
    const input = assignAgentListingsSchema.parse(raw);
    const existing = await requireAgent(input.agentId);
    const result = await agentRepository.assignListings(
      existing.organizationId,
      existing.id,
      input.propertyIds,
    );
    await audit(
      existing.organizationId,
      session.user?.id,
      "agent.listings_assigned",
      existing.id,
      { count: result.updated },
    );
    return result;
  },

  async unassignListings(raw: unknown) {
    const session = await requirePermission("agent:manage");
    const input = unassignAgentListingsSchema.parse(raw);
    const existing = await requireAgent(input.agentId);
    const result = await agentRepository.unassignListings(
      existing.organizationId,
      existing.id,
      input.propertyIds,
    );
    await audit(
      existing.organizationId,
      session.user?.id,
      "agent.listings_unassigned",
      existing.id,
      { count: result.updated },
    );
    return result;
  },
};
