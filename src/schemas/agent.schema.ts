import { z } from "zod";

import { slugSchema } from "@/schemas/catalog.schema";

/** Comma / pipe / newline separated text from the admin inputs. */
const tagList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null || value === "") return [] as string[];
    const parts = Array.isArray(value) ? value : value.split(/[,|\n]/);
    return [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  });

const blankToNull = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    });

const optionalEmail = z
  .union([z.string().email(), z.literal("")])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalPhotoUrl = z
  .union([
    z.string().url(),
    z.string().regex(/^\/uploads\//, "Must be an absolute URL or /uploads path"),
    z.literal(""),
  ])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const agentProfileShape = {
  name: z.string().min(2).max(160),
  slug: slugSchema.optional(),
  title: blankToNull(120),
  email: optionalEmail,
  phone: blankToNull(40),
  whatsapp: blankToNull(40),
  bio: blankToNull(4000),
  photoUrl: optionalPhotoUrl,
  photoMediaId: blankToNull(80),
  specialties: tagList,
  languages: tagList,
  serviceAreas: tagList,
  reraNumber: blankToNull(80),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  metaTitle: blankToNull(70),
  metaDescription: blankToNull(180),
  /** Optional link to a login user so CRM assignment can follow the agent. */
  userId: z.string().min(1).optional().nullable(),
};

export const createAgentSchema = z.object({
  organizationId: z.string().min(1),
  ...agentProfileShape,
});

export const updateAgentSchema = z.object({
  id: z.string().min(1),
  ...agentProfileShape,
});

export const AGENT_STATUS_FILTERS = [
  "all",
  "active",
  "inactive",
  "featured",
] as const;

export const AGENT_SORT_OPTIONS = [
  "order",
  "name",
  "listings",
  "recent",
] as const;

export const listAgentsQuerySchema = z.object({
  organizationId: z.string().min(1),
  q: z.string().trim().max(160).optional(),
  status: z.enum(AGENT_STATUS_FILTERS).default("all"),
  sort: z.enum(AGENT_SORT_OPTIONS).default("order"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const setAgentVisibilitySchema = z
  .object({
    id: z.string().min(1),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((value) => value.isActive != null || value.isFeatured != null, {
    message: "Nothing to update",
  });

/** Ordered agent IDs — index 0 is shown first on the public team pages. */
export const reorderAgentsSchema = z.object({
  organizationId: z.string().min(1),
  orderedAgentIds: z.array(z.string().min(1)).max(500),
});

export const deleteAgentSchema = z.object({
  id: z.string().min(1),
  /** Where the agent's listings go. Null leaves them unassigned. */
  reassignToAgentId: z.string().min(1).nullable().optional(),
});

export const assignAgentListingsSchema = z.object({
  agentId: z.string().min(1),
  propertyIds: z.array(z.string().min(1)).min(1).max(500),
});

export const unassignAgentListingsSchema = z.object({
  agentId: z.string().min(1),
  propertyIds: z.array(z.string().min(1)).min(1).max(500),
});

export const searchAssignableListingsSchema = z.object({
  organizationId: z.string().min(1),
  agentId: z.string().min(1),
  q: z.string().trim().max(160).optional(),
  scope: z.enum(["unassigned", "all"]).default("unassigned"),
  take: z.number().int().min(1).max(50).default(20),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type ListAgentsQuery = z.infer<typeof listAgentsQuerySchema>;
export type AgentStatusFilter = (typeof AGENT_STATUS_FILTERS)[number];
export type AgentSortOption = (typeof AGENT_SORT_OPTIONS)[number];
export type SearchAssignableListingsInput = z.infer<
  typeof searchAssignableListingsSchema
>;
