import { AppError } from "@/lib/errors";
import { getCrmProvider } from "@/providers/crm";
import { leadRepository } from "@/repositories/lead.repository";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  assignLeadSchema,
  createLeadSchema,
  leadNoteSchema,
  updateLeadStatusSchema,
  type CreateLeadInput,
} from "@/schemas/lead.schema";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseCampaignConfig,
  parseExtraHeaders,
} from "@/types/landing-campaign";

function parseDevice(userAgent?: string | null) {
  if (!userAgent) return { device: null, browser: null };
  const device = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? "mobile" : "desktop";
  let browser = "unknown";
  if (/Edg\//i.test(userAgent)) browser = "edge";
  else if (/Chrome\//i.test(userAgent)) browser = "chrome";
  else if (/Safari\//i.test(userAgent)) browser = "safari";
  else if (/Firefox\//i.test(userAgent)) browser = "firefox";
  return { device, browser };
}

async function forwardCampaignWebhook(input: {
  organizationId: string;
  landingPage?: string | null;
  payload: Record<string, unknown>;
}) {
  const slug = input.landingPage?.trim();
  if (!slug) return;

  const page = await prisma.landingPage.findFirst({
    where: {
      organizationId: input.organizationId,
      slug,
      deletedAt: null,
    },
    select: { schemaJson: true },
  });
  if (!page) return;

  const leadForm = parseCampaignConfig(page.schemaJson).leadForm;
  const apiUrl = leadForm.apiUrl?.trim();
  if (!apiUrl || !/^https?:\/\//i.test(apiUrl)) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...parseExtraHeaders(leadForm.extraHeaders || ""),
  };
  const apiKey = leadForm.apiKey?.trim();
  if (apiKey) {
    if (leadForm.apiKeyHeader === "Authorization") {
      headers.Authorization = apiKey.startsWith("Bearer ")
        ? apiKey
        : `Bearer ${apiKey}`;
    } else {
      headers[leadForm.apiKeyHeader] = apiKey;
    }
  }

  const res = await fetch(apiUrl, {
    method: leadForm.method || "POST",
    headers,
    body: JSON.stringify(input.payload),
  });
  if (!res.ok) {
    throw new Error(`Campaign webhook responded ${res.status}`);
  }
}

/**
 * Lead service — Neon is source of truth.
 * CRM push is best-effort; failures never roll back lead creation.
 */
export const leadService = {
  async capture(
    raw: CreateLeadInput,
    meta: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const parsed = createLeadSchema.safeParse(raw);
    if (!parsed.success) {
      throw new AppError("Invalid lead payload", {
        code: "VALIDATION_ERROR",
        status: 422,
        details: parsed.error.flatten(),
      });
    }

    if (!parsed.data.phone) {
      throw new AppError("Phone number is required", {
        code: "VALIDATION_ERROR",
        status: 422,
      });
    }

    let organizationId = parsed.data.organizationId;
    if (!organizationId) {
      const org = await organizationRepository.getDefault();
      if (!org) {
        throw new AppError("Organization not configured", {
          code: "ORG_MISSING",
          status: 500,
        });
      }
      organizationId = org.id;
    }

    const { device, browser } = parseDevice(meta.userAgent);

    const lead = await leadRepository.create({
      ...parsed.data,
      organizationId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      device,
      browser,
    });

    if (parsed.data.notes) {
      await leadRepository.addNote(lead.id, parsed.data.notes);
    }

    await prisma.activityLog.create({
      data: {
        organizationId,
        action: "lead.created",
        entityType: "Lead",
        entityId: lead.id,
        ipAddress: meta.ipAddress ?? undefined,
        metadata: {
          leadSource: lead.leadSource,
          landingPage: lead.landingPage,
        },
      },
    });

    await prisma.notification.create({
      data: {
        organizationId,
        type: "NEW_LEAD",
        title: "New lead received",
        body: `${lead.name} submitted a lead`,
        href: `/admin/leads/${lead.id}`,
        metadata: { leadId: lead.id },
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        organizationId,
        type: "LEAD_SUBMIT",
        path: lead.landingPage ?? undefined,
        propertyId: lead.propertyId ?? undefined,
        utmSource: lead.utmSource ?? undefined,
        utmMedium: lead.utmMedium ?? undefined,
        utmCampaign: lead.utmCampaign ?? undefined,
        gclid: lead.gclid ?? undefined,
        fbclid: lead.fbclid ?? undefined,
        metadata: {
          leadId: lead.id,
          leadSource: lead.leadSource,
        },
      },
    });

    if (lead.propertyId) {
      await prisma.propertyAnalytics.upsert({
        where: { propertyId: lead.propertyId },
        create: { propertyId: lead.propertyId, enquiries: 1 },
        update: { enquiries: { increment: 1 } },
      });
    }

    try {
      await forwardCampaignWebhook({
        organizationId,
        landingPage: lead.landingPage,
        payload: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          campaign: lead.campaign,
          landingPage: lead.landingPage,
          leadSource: lead.leadSource,
          notes: parsed.data.notes,
          metadata: parsed.data.metadata,
        },
      });
    } catch (error) {
      console.error("[leads] campaign webhook failed:", error);
    }

    // Fire-and-forget CRM sync (does not block response semantics when awaited carefully)
    void leadService.pushToCrm(lead.id);

    return lead;
  },

  async pushToCrm(leadId: string) {
    const lead = await leadRepository.findById(leadId);
    if (!lead) return null;

    if (process.env.LEADRAT_ENABLED !== "true") {
      await leadRepository.updateCrmSync(leadId, {
        crmSyncStatus: "PENDING",
        crmResponse: { message: "LeadRat disabled — queued for later" },
      });
      return { status: "PENDING" as const };
    }

    const provider = getCrmProvider("leadrat");
    const preferenceNotes = lead.notes
      .map((n) => n.body)
      .filter(Boolean)
      .join("\n\n");
    const metadata =
      lead.metadata && typeof lead.metadata === "object" && !Array.isArray(lead.metadata)
        ? (lead.metadata as Record<string, unknown>)
        : undefined;

    const payload = {
      organizationId: lead.organizationId,
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      whatsapp: lead.whatsapp,
      country: lead.country,
      propertyId: lead.propertyId,
      propertyTitle: lead.property?.name ?? null,
      campaign: lead.campaign,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      gclid: lead.gclid,
      fbclid: lead.fbclid,
      referrer: lead.referrer,
      landingPage: lead.landingPage,
      leadSource: lead.leadSource,
      notes: preferenceNotes || null,
      metadata,
    };

    try {
      const result = await provider.pushLead(
        {
          organizationId: lead.organizationId,
          credentials: {
            apiKey: process.env.LEADRAT_API_KEY,
            secretKey: process.env.LEADRAT_SECRET_KEY,
            tenant: process.env.LEADRAT_TENANT,
            baseUrl: process.env.LEADRAT_API_BASE_URL,
          },
        },
        payload,
      );

      const status =
        result.status === "SYNCED"
          ? "SYNCED"
          : result.status === "FAILED"
            ? "FAILED"
            : "PENDING";

      await leadRepository.updateCrmSync(leadId, {
        crmSyncStatus: status,
        crmExternalId: result.externalId ?? null,
        crmResponse: result.response ?? result,
        crmRetryCount: lead.crmRetryCount + (status === "SYNCED" ? 0 : 1),
      });

      await leadRepository.addCrmSyncLog({
        leadId,
        status,
        request: payload,
        response: result.response ?? result,
        error: result.error ?? null,
        attempt: lead.crmRetryCount + 1,
      });

      if (status === "FAILED") {
        await prisma.notification.create({
          data: {
            organizationId: lead.organizationId,
            type: "CRM_SYNC_FAILED",
            title: "LeadRat sync failed",
            body: result.error ?? "CRM sync failed",
            href: `/admin/leads/${lead.id}`,
            metadata: { leadId: lead.id },
          },
        });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "CRM sync error";
      await leadRepository.updateCrmSync(leadId, {
        crmSyncStatus: "PENDING",
        crmResponse: { error: message },
        crmRetryCount: lead.crmRetryCount + 1,
      });
      await leadRepository.addCrmSyncLog({
        leadId,
        status: "FAILED",
        request: payload,
        error: message,
        attempt: lead.crmRetryCount + 1,
      });
      return { status: "PENDING" as const, error: message };
    }
  },

  async retryCrmSync(leadId: string) {
    await requirePermission("lead:crm_retry");
    return leadService.pushToCrm(leadId);
  },

  async assign(raw: unknown) {
    await requirePermission("lead:assign");
    const parsed = assignLeadSchema.parse(raw);
    return leadRepository.assign(parsed.leadId, parsed.assignedToId);
  },

  async updateStatus(raw: unknown) {
    await requirePermission("lead:update");
    const parsed = updateLeadStatusSchema.parse(raw);
    return leadRepository.updateStatus(parsed.leadId, parsed.status);
  },

  async addNote(raw: unknown, userId?: string) {
    await requirePermission("lead:update");
    const parsed = leadNoteSchema.parse(raw);
    return leadRepository.addNote(parsed.leadId, parsed.body, userId);
  },

  async list(
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
    await requirePermission("lead:read");
    return leadRepository.listByOrganization(organizationId, options);
  },

  async dashboard(organizationId: string) {
    await requirePermission("lead:read");
    return leadRepository.getDashboardCounts(organizationId);
  },
};
