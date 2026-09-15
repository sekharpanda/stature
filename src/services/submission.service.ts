import type {
  ContentEntityType,
  ContentSubmission,
  Prisma,
  SubmissionKind,
  WorkflowState,
} from "@prisma/client";

import { ROLE_SLUGS } from "@/constants/permissions";
import { getSession, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { embedBlogCover } from "@/lib/blog-content";
import { AppError, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { agentRepository } from "@/repositories/agent.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { organizationRepository } from "@/repositories/organization.repository";
import { propertyRepository } from "@/repositories/property.repository";
import {
  submissionRepository,
  type CreateSubmissionData,
} from "@/repositories/submission.repository";
import {
  listSubmissionsQuerySchema,
  reviewDecisionSchema,
} from "@/schemas/portal.schema";
import { propertyService } from "@/services/property.service";

export const ENTITY_LABELS: Record<ContentEntityType, string> = {
  PROPERTY: "Listing",
  BLOG_POST: "Blog post",
  AGENT_PROFILE: "Profile",
  AGENT_ACCOUNT: "Portal access",
  PAGE: "Page",
  HOMEPAGE: "Homepage",
  LANDING_PAGE: "Landing page",
};

export type FieldChange = {
  field: string;
  label: string;
  from: string | null;
  to: string | null;
};

function formatValue(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.length ? value.join(", ") : null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value).trim();
  return text === "" ? null : text;
}

/** Field-by-field diff, stored at submit time so the queue reads fast. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labels: Record<string, string>,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const [field, label] of Object.entries(labels)) {
    if (!(field in after)) continue;
    const from = formatValue(before[field]);
    const to = formatValue(after[field]);
    if (from === to) continue;
    changes.push({ field, label, from, to });
  }
  return changes;
}

async function recordWorkflowAction(input: {
  entityType: ContentEntityType;
  entityId: string;
  fromState?: WorkflowState | null;
  toState: WorkflowState;
  comment?: string | null;
  actorId?: string | null;
}) {
  await prisma.workflowAction.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      fromState: input.fromState ?? null,
      toState: input.toState,
      comment: input.comment ?? null,
      actorId: input.actorId ?? null,
    },
  });
}

async function logActivity(input: {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
    },
  });
}

export const submissionService = {
  /**
   * Queues one thing for review. Any earlier pending request for the same
   * record is withdrawn so a reviewer never sees two competing versions.
   */
  async open(
    data: CreateSubmissionData & { actorName?: string | null },
  ): Promise<ContentSubmission> {
    if (data.entityId) {
      const existing = await submissionRepository.findPending(
        data.entityType,
        data.entityId,
      );
      if (existing) await submissionRepository.withdraw(existing.id);
    }

    const submission = await submissionRepository.create(data);

    if (data.entityId) {
      await recordWorkflowAction({
        entityType: data.entityType,
        entityId: data.entityId,
        toState: "IN_REVIEW",
        comment: data.note ?? null,
        actorId: data.submittedById ?? null,
      });
    }

    const label = ENTITY_LABELS[data.entityType];
    await notificationRepository.create({
      organizationId: data.organizationId,
      type: "WORKFLOW_SUBMITTED",
      title: `${label} awaiting approval`,
      body: `${data.actorName ? `${data.actorName} submitted` : "Submitted"}: ${data.title}`,
      href: `/admin/approvals/${submission.id}`,
      metadata: { submissionId: submission.id, entityType: data.entityType },
    });

    await logActivity({
      organizationId: data.organizationId,
      userId: data.submittedById ?? null,
      action: "submission.opened",
      entityType: "ContentSubmission",
      entityId: submission.id,
      metadata: { entityType: data.entityType, kind: data.kind },
    });

    return submission;
  },

  async listQueue(input: {
    organizationId?: string;
    status?: "pending" | "approved" | "rejected" | "all";
    page?: number;
    pageSize?: number;
  }) {
    await requirePermission("submission:review");
    let organizationId = input.organizationId;
    if (!organizationId) {
      const org = await organizationRepository.getDefault();
      if (!org) throw new NotFoundError("Organization not found");
      organizationId = org.id;
    }

    const query = listSubmissionsQuerySchema.parse({ ...input, organizationId });
    const [result, counts] = await Promise.all([
      submissionRepository.list(query),
      submissionRepository.countByStatus(organizationId),
    ]);
    return { ...result, counts, status: query.status };
  },

  async getDetail(id: string) {
    await requirePermission("submission:review");
    const submission = await submissionRepository.findById(id);
    if (!submission) throw new NotFoundError("Submission not found");

    const changes = (submission.changes as FieldChange[] | null) ?? [];
    const preview = await buildPreview(submission);
    const agentOptions =
      submission.entityType === "AGENT_ACCOUNT"
        ? await agentRepository.listAssignable(submission.organizationId)
        : [];

    return { submission, changes, preview, agentOptions };
  },

  async decide(raw: unknown) {
    const session = await requirePermission("submission:review");
    const input = reviewDecisionSchema.parse(raw);

    const submission = await submissionRepository.findById(input.submissionId);
    if (!submission) throw new NotFoundError("Submission not found");
    if (submission.status !== "PENDING") {
      throw new AppError("This submission has already been reviewed", {
        status: 409,
      });
    }

    if (input.decision === "approve") {
      await applyApproval(submission, input.agentId ?? null);
    } else {
      await applyRejection(submission);
    }

    const decided = await submissionRepository.decide(
      submission.id,
      input.decision === "approve" ? "APPROVED" : "REJECTED",
      session.user.id,
      input.reviewNote ?? null,
    );

    if (submission.entityId) {
      await recordWorkflowAction({
        entityType: submission.entityType,
        entityId: submission.entityId,
        fromState: "IN_REVIEW",
        toState: input.decision === "approve" ? "PUBLISHED" : "REJECTED",
        comment: input.reviewNote ?? null,
        actorId: session.user.id,
      });
    }

    if (submission.submittedById) {
      const label = ENTITY_LABELS[submission.entityType];
      await notificationRepository.create({
        organizationId: submission.organizationId,
        userId: submission.submittedById,
        type: input.decision === "approve" ? "WORKFLOW_APPROVED" : "WORKFLOW_REJECTED",
        title:
          input.decision === "approve"
            ? `${label} approved — it is now live`
            : `${label} needs changes`,
        body: input.reviewNote ?? submission.title,
        href: portalHrefFor(submission),
        metadata: { submissionId: submission.id },
      });
    }

    await logActivity({
      organizationId: submission.organizationId,
      userId: session.user.id,
      action: `submission.${input.decision}`,
      entityType: "ContentSubmission",
      entityId: submission.id,
      metadata: { entityType: submission.entityType, kind: submission.kind },
    });

    return decided;
  },
};

function portalHrefFor(submission: ContentSubmission) {
  switch (submission.entityType) {
    case "PROPERTY":
      return submission.entityId
        ? `/admin/my/listings/${submission.entityId}`
        : "/admin/my/listings";
    case "BLOG_POST":
      return submission.entityId
        ? `/admin/my/posts/${submission.entityId}`
        : "/admin/my/posts";
    case "AGENT_PROFILE":
      return "/admin/my/profile";
    default:
      return "/admin/my";
  }
}

async function buildPreview(submission: ContentSubmission) {
  if (!submission.entityId) return null;

  if (submission.entityType === "PROPERTY") {
    const property = await prisma.property.findFirst({
      where: { id: submission.entityId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        workflowState: true,
        minPrice: true,
        currency: true,
        agent: { select: { id: true, name: true, slug: true } },
        city: { select: { name: true } },
        area: { select: { name: true } },
        _count: { select: { images: { where: { deletedAt: null } } } },
      },
    });
    if (!property) return null;
    return {
      kind: "property" as const,
      title: property.name,
      publicHref: property.status === "PUBLISHED" ? `/properties/${property.slug}` : null,
      adminHref: `/admin/properties/${property.id}`,
      meta: [
        property.city?.name,
        property.area?.name,
        property.agent?.name ? `Agent: ${property.agent.name}` : null,
        `${property._count.images} photo${property._count.images === 1 ? "" : "s"}`,
      ].filter((value): value is string => Boolean(value)),
    };
  }

  if (submission.entityType === "BLOG_POST") {
    const post = await prisma.blogPost.findFirst({
      where: { id: submission.entityId },
      select: {
        id: true,
        title: true,
        slug: true,
        workflowState: true,
        excerpt: true,
      },
    });
    if (!post) return null;
    return {
      kind: "post" as const,
      title: post.title,
      publicHref: post.workflowState === "PUBLISHED" ? `/blog/${post.slug}` : null,
      adminHref: `/admin/blog/${post.id}`,
      meta: [post.excerpt ?? null, `State: ${post.workflowState}`].filter(
        (value): value is string => Boolean(value),
      ),
    };
  }

  if (submission.entityType === "AGENT_PROFILE") {
    const agent = await prisma.agent.findFirst({
      where: { id: submission.entityId },
      select: { id: true, name: true, slug: true, isActive: true },
    });
    if (!agent) return null;
    return {
      kind: "agent" as const,
      title: agent.name,
      publicHref: agent.isActive ? `/our-team/${agent.slug}` : null,
      adminHref: `/admin/agents/${agent.id}`,
      meta: [],
    };
  }

  return null;
}

async function applyApproval(
  submission: ContentSubmission,
  chosenAgentId: string | null,
) {
  const payload = (submission.payload ?? {}) as Record<string, unknown>;

  switch (submission.entityType) {
    case "PROPERTY": {
      if (!submission.entityId) throw new AppError("Listing is missing");
      if (submission.kind === "UPDATE") {
        const property = await prisma.property.findFirst({
          where: { id: submission.entityId },
          select: { agentId: true, organizationId: true },
        });
        if (!property?.agentId) throw new NotFoundError("Listing not found");
        await propertyService.upsertFromPortal(payload, {
          organizationId: property.organizationId,
          agentId: property.agentId,
          propertyId: submission.entityId,
          status: "PUBLISHED",
          workflowState: "PUBLISHED",
        });
        return;
      }
      await propertyRepository.setPortalWorkflow(
        submission.organizationId,
        submission.entityId,
        { workflowState: "PUBLISHED", status: "PUBLISHED", publish: true },
      );
      return;
    }

    case "BLOG_POST": {
      if (!submission.entityId) throw new AppError("Post is missing");
      const post = await prisma.blogPost.findFirst({
        where: { id: submission.entityId },
        select: { id: true, content: true, publishedAt: true },
      });
      if (!post) throw new NotFoundError("Post not found");

      const data: Prisma.BlogPostUpdateInput = {
        workflowState: "PUBLISHED",
        publishedAt: post.publishedAt ?? new Date(),
      };

      if (submission.kind === "UPDATE") {
        if (typeof payload.title === "string") data.title = payload.title;
        if ("excerpt" in payload) data.excerpt = (payload.excerpt as string) ?? null;
        if ("metaTitle" in payload) data.metaTitle = (payload.metaTitle as string) ?? null;
        if ("metaDescription" in payload) {
          data.metaDescription = (payload.metaDescription as string) ?? null;
        }
        if ("content" in payload || "coverUrl" in payload) {
          data.content = embedBlogCover(
            (payload.content as string | null) ?? post.content,
            (payload.coverUrl as string | null) ?? null,
          );
        }
      }

      await prisma.blogPost.update({ where: { id: post.id }, data });
      return;
    }

    case "AGENT_PROFILE": {
      if (!submission.entityId) throw new AppError("Profile is missing");
      await agentRepository.applyProfilePatch(submission.entityId, {
        title: (payload.title as string | null) ?? null,
        email: (payload.email as string | null) ?? null,
        phone: (payload.phone as string | null) ?? null,
        whatsapp: (payload.whatsapp as string | null) ?? null,
        bio: (payload.bio as string | null) ?? null,
        photoUrl: (payload.photoUrl as string | null) ?? null,
        photoMediaId: (payload.photoMediaId as string | null) ?? null,
        languages: (payload.languages as string[] | undefined) ?? [],
        specialties: (payload.specialties as string[] | undefined) ?? [],
        serviceAreas: (payload.serviceAreas as string[] | undefined) ?? [],
        reraNumber: (payload.reraNumber as string | null) ?? null,
        yearsExperience: (payload.yearsExperience as number | null) ?? null,
      });
      return;
    }

    case "AGENT_ACCOUNT": {
      await grantPortalAccess(submission, chosenAgentId, payload);
      return;
    }

    default:
      throw new AppError("This submission type cannot be approved yet", {
        status: 400,
      });
  }
}

async function applyRejection(submission: ContentSubmission) {
  if (submission.kind === "UPDATE") return; // Live version stays as it is.

  if (submission.entityType === "PROPERTY" && submission.entityId) {
    await propertyRepository.setPortalWorkflow(
      submission.organizationId,
      submission.entityId,
      { workflowState: "REJECTED", status: "DRAFT" },
    );
    return;
  }

  if (submission.entityType === "BLOG_POST" && submission.entityId) {
    await prisma.blogPost.update({
      where: { id: submission.entityId },
      data: { workflowState: "REJECTED" },
    });
    return;
  }

  if (submission.entityType === "AGENT_ACCOUNT" && submission.submittedById) {
    await prisma.user.update({
      where: { id: submission.submittedById },
      data: { status: "DISABLED" },
    });
  }
}

/** Turns an approved access request into a working portal login. */
async function grantPortalAccess(
  submission: ContentSubmission,
  chosenAgentId: string | null,
  payload: Record<string, unknown>,
) {
  const userId = submission.submittedById;
  if (!userId) throw new AppError("This request has no account attached");

  const role = await prisma.role.findFirst({
    where: {
      organizationId: submission.organizationId,
      slug: ROLE_SLUGS.SALES_AGENT,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!role) {
    throw new AppError("The sales_agent role is missing. Run the RBAC sync.", {
      status: 500,
    });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "ACTIVE",
      organizationId: submission.organizationId,
      emailVerified: true,
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  const existingLink = await prisma.userRole.findFirst({
    where: { userId, roleId: role.id },
    select: { id: true },
  });
  if (existingLink) {
    await prisma.userRole.update({
      where: { id: existingLink.id },
      data: { deletedAt: null },
    });
  } else {
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  let agent = chosenAgentId
    ? await prisma.agent.findFirst({
        where: {
          id: chosenAgentId,
          organizationId: submission.organizationId,
          deletedAt: null,
        },
        select: { id: true, userId: true },
      })
    : await prisma.agent.findFirst({
        where: { userId, deletedAt: null },
        select: { id: true, userId: true },
      });

  if (agent && agent.userId && agent.userId !== userId) {
    throw new AppError("That profile is already linked to another login", {
      status: 409,
    });
  }

  if (!agent) {
    const baseSlug = slugify(user.name || user.email.split("@")[0]);
    let slug = baseSlug;
    let attempt = 1;
    while (
      await prisma.agent.findFirst({
        where: { organizationId: submission.organizationId, slug },
        select: { id: true },
      })
    ) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const created = await prisma.agent.create({
      data: {
        organizationId: submission.organizationId,
        userId,
        name: user.name,
        slug,
        title: "Property Consultant",
        email: user.email,
        phone: user.phone ?? (payload.phone as string | null) ?? null,
        reraNumber: (payload.reraNumber as string | null) ?? null,
        // Staff decide when a new consultant appears on the public roster.
        isActive: false,
      },
      select: { id: true, userId: true },
    });
    agent = created;
  } else if (!agent.userId) {
    await agentRepository.linkUser(agent.id, userId);
  }

  await submissionRepository.setEntityId(submission.id, agent.id);
}

export type SubmissionQueue = Awaited<ReturnType<typeof submissionService.listQueue>>;
export type SubmissionDetail = Awaited<ReturnType<typeof submissionService.getDetail>>;
export type SubmissionPreview = Awaited<ReturnType<typeof buildPreview>>;

/** Used by the portal to show its own history without the review permission. */
export async function listMySubmissions() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  return submissionRepository.listForSubmitter(session.user.id);
}

export type SubmissionKindValue = SubmissionKind;
