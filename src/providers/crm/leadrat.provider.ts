import type { CrmLeadPayload, CrmProvider, CrmProviderContext, CrmPushResult } from "./types";
import {
  getLeadRatConfig,
  isLeadRatReady,
  leadRatClient,
  mapLeadToLeadRatPayload,
} from "@/providers/leadrat";

/**
 * LeadRat CRM adapter — pushes website leads into LeadRat.
 * Failures return FAILED/PENDING; never throw after lead is persisted.
 */
export class LeadRatCrmProvider implements CrmProvider {
  readonly name = "leadrat";

  async pushLead(
    ctx: CrmProviderContext,
    lead: CrmLeadPayload,
  ): Promise<CrmPushResult> {
    const config = getLeadRatConfig({
      apiKey: (ctx.credentials?.apiKey as string | undefined) ?? undefined,
      secretKey: (ctx.credentials?.secretKey as string | undefined) ?? undefined,
      tenant: (ctx.credentials?.tenant as string | undefined) ?? undefined,
      baseUrl: (ctx.credentials?.baseUrl as string | undefined) ?? undefined,
    });

    if (!isLeadRatReady(config)) {
      return {
        status: "PENDING",
        error: "LeadRat not configured or disabled",
        response: { configured: false },
      };
    }

    try {
      const body = mapLeadToLeadRatPayload({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        whatsapp: lead.whatsapp,
        notes: lead.notes,
        leadSource: lead.leadSource,
        propertyTitle: lead.propertyTitle,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        landingPage: lead.landingPage,
        campaign: lead.campaign,
      });

      const response = await leadRatClient.createLead(body, config);
      const externalId =
        typeof response.data === "string"
          ? response.data
          : (response.data as { id?: string } | undefined)?.id ?? null;

      if (response.succeeded === false) {
        return {
          status: "FAILED",
          error: response.message ?? "LeadRat rejected lead",
          response,
        };
      }

      return {
        status: "SYNCED",
        externalId,
        response,
      };
    } catch (error) {
      return {
        status: "FAILED",
        error: error instanceof Error ? error.message : "LeadRat push failed",
        response: error instanceof Error ? { message: error.message } : error,
      };
    }
  }

  async healthcheck(ctx: CrmProviderContext): Promise<boolean> {
    void ctx;
    return isLeadRatReady();
  }
}
