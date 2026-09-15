import { z } from "zod";

export const createLeadSchema = z.object({
  organizationId: z.string().min(1).optional(),
  name: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  whatsapp: z.string().min(6).max(30).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  propertyId: z.string().optional().nullable(),
  developerId: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
  formId: z.string().optional().nullable(),
  campaign: z.string().max(160).optional().nullable(),
  utmSource: z.string().max(160).optional().nullable(),
  utmMedium: z.string().max(160).optional().nullable(),
  utmCampaign: z.string().max(160).optional().nullable(),
  utmTerm: z.string().max(160).optional().nullable(),
  utmContent: z.string().max(160).optional().nullable(),
  gclid: z.string().max(200).optional().nullable(),
  fbclid: z.string().max(200).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  landingPage: z.string().max(500).optional().nullable(),
  leadSource: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const assignLeadSchema = z.object({
  leadId: z.string().min(1),
  assignedToId: z.string().min(1).nullable(),
});

export const leadNoteSchema = z.object({
  leadId: z.string().min(1),
  body: z.string().min(1).max(5000),
});

export const updateLeadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "FOLLOW_UP",
    "MEETING_SCHEDULED",
    "SITE_VISIT",
    "CLOSED",
    "LOST",
  ]),
});
