import type {
  ContentEntityType,
  Prisma,
  SubmissionKind,
  SubmissionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import type {
  ListSubmissionsQuery,
  SubmissionStatusFilter,
} from "@/schemas/portal.schema";

const notDeleted = { deletedAt: null };

const withPeople = {
  submittedBy: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ContentSubmissionInclude;

function statusWhere(
  status: SubmissionStatusFilter,
): Prisma.ContentSubmissionWhereInput {
  switch (status) {
    case "pending":
      return { status: "PENDING" };
    case "approved":
      return { status: "APPROVED" };
    case "rejected":
      return { status: { in: ["REJECTED", "WITHDRAWN"] } };
    default:
      return {};
  }
}

export type CreateSubmissionData = {
  organizationId: string;
  entityType: ContentEntityType;
  entityId?: string | null;
  kind: SubmissionKind;
  title: string;
  payload?: Prisma.InputJsonValue;
  changes?: Prisma.InputJsonValue;
  note?: string | null;
  submittedById?: string | null;
};

export const submissionRepository = {
  async list(query: ListSubmissionsQuery) {
    const where: Prisma.ContentSubmissionWhereInput = {
      organizationId: query.organizationId,
      ...notDeleted,
      ...statusWhere(query.status),
    };

    const [items, total] = await Promise.all([
      prisma.contentSubmission.findMany({
        where,
        orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: withPeople,
      }),
      prisma.contentSubmission.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async listForSubmitter(userId: string, take = 50) {
    return prisma.contentSubmission.findMany({
      where: { submittedById: userId, ...notDeleted },
      orderBy: [{ submittedAt: "desc" }],
      take,
      include: withPeople,
    });
  },

  async findById(id: string) {
    return prisma.contentSubmission.findFirst({
      where: { id, ...notDeleted },
      include: withPeople,
    });
  },

  /** The open request for one record, used to block double submissions. */
  async findPending(entityType: ContentEntityType, entityId: string) {
    return prisma.contentSubmission.findFirst({
      where: { entityType, entityId, status: "PENDING", ...notDeleted },
      orderBy: { submittedAt: "desc" },
    });
  },

  async pendingByEntityIds(entityType: ContentEntityType, entityIds: string[]) {
    if (entityIds.length === 0) return new Map<string, string>();
    const rows = await prisma.contentSubmission.findMany({
      where: {
        entityType,
        entityId: { in: entityIds },
        status: "PENDING",
        ...notDeleted,
      },
      select: { id: true, entityId: true },
    });
    return new Map(
      rows
        .filter((row): row is { id: string; entityId: string } =>
          Boolean(row.entityId),
        )
        .map((row) => [row.entityId, row.id]),
    );
  },

  async countByStatus(organizationId: string) {
    const rows = await prisma.contentSubmission.groupBy({
      by: ["status"],
      where: { organizationId, ...notDeleted },
      _count: { _all: true },
    });
    return rows.reduce<Record<SubmissionStatus, number>>(
      (acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      },
      { PENDING: 0, APPROVED: 0, REJECTED: 0, WITHDRAWN: 0 },
    );
  },

  async create(data: CreateSubmissionData) {
    return prisma.contentSubmission.create({
      data: {
        organizationId: data.organizationId,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        kind: data.kind,
        title: data.title,
        payload: data.payload,
        changes: data.changes,
        note: data.note ?? null,
        submittedById: data.submittedById ?? null,
      },
    });
  },

  async setEntityId(id: string, entityId: string) {
    return prisma.contentSubmission.update({ where: { id }, data: { entityId } });
  },

  async withdraw(id: string) {
    return prisma.contentSubmission.update({
      where: { id },
      data: { status: "WITHDRAWN", reviewedAt: new Date() },
    });
  },

  async decide(
    id: string,
    decision: Extract<SubmissionStatus, "APPROVED" | "REJECTED">,
    reviewedById: string | null,
    reviewNote: string | null,
  ) {
    return prisma.contentSubmission.update({
      where: { id },
      data: {
        status: decision,
        reviewedById,
        reviewNote,
        reviewedAt: new Date(),
      },
      include: withPeople,
    });
  },
};
