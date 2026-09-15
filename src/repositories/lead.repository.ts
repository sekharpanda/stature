import { prisma } from "@/lib/db";
import type { CreateLeadInput } from "@/schemas/lead.schema";
import type { Prisma } from "@prisma/client";

export type LeadCreateContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
  device?: string | null;
  browser?: string | null;
};

export const leadRepository = {
  async create(input: CreateLeadInput & LeadCreateContext) {
    return prisma.lead.create({
      data: {
        organizationId: input.organizationId!,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        whatsapp: input.whatsapp ?? null,
        country: input.country ?? null,
        propertyId: input.propertyId ?? null,
        developerId: input.developerId ?? null,
        areaId: input.areaId ?? null,
        formId: input.formId ?? null,
        campaign: input.campaign ?? null,
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
        utmTerm: input.utmTerm ?? null,
        utmContent: input.utmContent ?? null,
        gclid: input.gclid ?? null,
        fbclid: input.fbclid ?? null,
        referrer: input.referrer ?? null,
        landingPage: input.landingPage ?? null,
        leadSource: input.leadSource ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        device: input.device ?? null,
        browser: input.browser ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        status: "NEW",
        crmSyncStatus: "PENDING",
      },
    });
  },

  async findById(id: string) {
    return prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        notes: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        crmSyncLogs: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  },

  async listByOrganization(
    organizationId: string,
    options?: {
      take?: number;
      status?:
        | "NEW"
        | "CONTACTED"
        | "FOLLOW_UP"
        | "MEETING_SCHEDULED"
        | "SITE_VISIT"
        | "CLOSED"
        | "LOST";
      q?: string;
    },
  ) {
    const take = options?.take ?? 50;
    const q = options?.q?.trim();
    return prisma.lead.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(options?.status ? { status: options.status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { whatsapp: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        property: { select: { id: true, name: true, slug: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async updateStatus(
    leadId: string,
    status:
      | "NEW"
      | "CONTACTED"
      | "FOLLOW_UP"
      | "MEETING_SCHEDULED"
      | "SITE_VISIT"
      | "CLOSED"
      | "LOST",
  ) {
    return prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
  },

  async listPendingCrmSync(organizationId: string, take = 50) {
    return prisma.lead.findMany({
      where: {
        organizationId,
        deletedAt: null,
        crmSyncStatus: { in: ["PENDING", "FAILED"] },
      },
      orderBy: { createdAt: "asc" },
      take,
    });
  },

  async updateCrmSync(
    leadId: string,
    data: {
      crmSyncStatus: "PENDING" | "SYNCED" | "FAILED" | "NOT_REQUIRED";
      crmExternalId?: string | null;
      crmResponse?: unknown;
      crmRetryCount?: number;
    },
  ) {
    return prisma.lead.update({
      where: { id: leadId },
      data: {
        crmSyncStatus: data.crmSyncStatus,
        crmExternalId: data.crmExternalId ?? undefined,
        crmResponse: data.crmResponse as Prisma.InputJsonValue | undefined,
        crmLastSyncedAt: data.crmSyncStatus === "SYNCED" ? new Date() : undefined,
        crmRetryCount: data.crmRetryCount,
      },
    });
  },

  async addCrmSyncLog(input: {
    leadId: string;
    status: "PENDING" | "SYNCED" | "FAILED" | "NOT_REQUIRED";
    request?: unknown;
    response?: unknown;
    error?: string | null;
    attempt?: number;
  }) {
    return prisma.crmSyncLog.create({
      data: {
        leadId: input.leadId,
        provider: "leadrat",
        status: input.status,
        request: input.request as Prisma.InputJsonValue | undefined,
        response: input.response as Prisma.InputJsonValue | undefined,
        error: input.error ?? null,
        attempt: input.attempt ?? 1,
      },
    });
  },

  async assign(leadId: string, assignedToId: string | null) {
    return prisma.lead.update({
      where: { id: leadId },
      data: { assignedToId },
    });
  },

  async addNote(leadId: string, body: string, userId?: string | null) {
    return prisma.leadNote.create({
      data: {
        leadId,
        body,
        userId: userId ?? null,
      },
    });
  },

  async getDashboardCounts(organizationId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, today, pending, failed, synced] = await Promise.all([
      prisma.lead.count({ where: { organizationId, deletedAt: null } }),
      prisma.lead.count({
        where: { organizationId, deletedAt: null, createdAt: { gte: startOfDay } },
      }),
      prisma.lead.count({
        where: { organizationId, deletedAt: null, crmSyncStatus: "PENDING" },
      }),
      prisma.lead.count({
        where: { organizationId, deletedAt: null, crmSyncStatus: "FAILED" },
      }),
      prisma.lead.count({
        where: { organizationId, deletedAt: null, crmSyncStatus: "SYNCED" },
      }),
    ]);

    return { total, today, pending, failed, synced };
  },
};
