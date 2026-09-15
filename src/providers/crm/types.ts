/**
 * CRM Provider — LeadRat is primary; website DB remains source of truth.
 * Lead capture must succeed even when CRM is down.
 */

export type CrmSyncResultStatus = "SYNCED" | "PENDING" | "FAILED";

export interface CrmLeadPayload {
  organizationId: string;
  leadId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  propertyId?: string | null;
  propertyTitle?: string | null;
  developerName?: string | null;
  areaName?: string | null;
  campaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
  leadSource?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CrmPushResult {
  status: CrmSyncResultStatus;
  externalId?: string | null;
  response?: unknown;
  error?: string | null;
}

export interface CrmProviderContext {
  organizationId: string;
  credentials?: Record<string, unknown>;
}

export interface CrmProvider {
  readonly name: string;
  pushLead(ctx: CrmProviderContext, lead: CrmLeadPayload): Promise<CrmPushResult>;
  healthcheck?(ctx: CrmProviderContext): Promise<boolean>;
}
