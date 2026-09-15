import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

export const createCountrySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(120),
  slug: slugSchema,
  isoCode: z.string().max(8).optional().nullable(),
});

export const createCitySchema = z.object({
  organizationId: z.string().min(1),
  countryId: z.string().min(1),
  name: z.string().min(2).max(120),
  slug: slugSchema,
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const createAreaSchema = z.object({
  organizationId: z.string().min(1),
  cityId: z.string().min(1),
  name: z.string().min(2).max(160),
  slug: slugSchema,
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  investmentHighlights: z.string().optional().nullable(),
  rentalYield: z.number().optional().nullable(),
  averageRoi: z.number().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const createCommunitySchema = z.object({
  organizationId: z.string().min(1),
  areaId: z.string().min(1),
  name: z.string().min(2).max(160),
  slug: slugSchema,
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  investmentHighlights: z.string().optional().nullable(),
  rentalYield: z.number().optional().nullable(),
  averageRoi: z.number().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const createDeveloperSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(160),
  slug: slugSchema,
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().optional().nullable(),
  website: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  phone: z.string().max(40).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
  headquarters: z.string().max(160).optional().nullable(),
  investmentHighlights: z.string().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  isPublished: z.boolean().optional(),
  logoMediaId: z.string().optional().nullable(),
});

/** Ordered developer IDs for public property listing (index 0 = first). */
export const updateDeveloperListingOrderSchema = z.object({
  organizationId: z.string().min(1),
  orderedDeveloperIds: z.array(z.string().min(1)).max(500),
});

export const assignPropertyAgentSchema = z.object({
  propertyId: z.string().min(1),
  agentId: z.string().min(1).nullable(),
});

export const createAmenitySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(120),
  slug: slugSchema,
  icon: z.string().max(80).optional().nullable(),
});

export const createCategorySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(120),
  slug: slugSchema,
  description: z.string().max(500).optional().nullable(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  domain: z.string().max(160).optional().nullable(),
  defaultCurrency: z.string().min(3).max(8).optional(),
  timezone: z.string().min(2).max(80).optional(),
  primaryColor: z.string().max(20).optional().nullable(),
});

export const SEO_WEBSITE_SETTING_KEYS = [
  "seo_default_title",
  "seo_default_description",
  "seo_og_site_name",
  "seo_canonical_base",
  "meta_robots_default",
] as const;

export const updateSeoSettingsSchema = z.object({
  organizationId: z.string().min(1),
  organization: z
    .object({
      name: z.string().min(2).max(160),
      domain: z.string().max(160).optional().nullable(),
      primaryColor: z.string().max(20).optional().nullable(),
      defaultCurrency: z.string().min(3).max(8),
    })
    .optional(),
  settings: z.array(
    z.object({
      key: z.string().min(1).max(120),
      value: z.string().max(2000),
    }),
  ),
});

export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type CreateDeveloperInput = z.infer<typeof createDeveloperSchema>;
export type UpdateDeveloperListingOrderInput = z.infer<
  typeof updateDeveloperListingOrderSchema
>;
export type AssignPropertyAgentInput = z.infer<typeof assignPropertyAgentSchema>;
export type CreateAmenityInput = z.infer<typeof createAmenitySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
/** Patch shape for org updates (Zod transform makes `email` required in z.infer output). */
export type UpdateOrganizationInput = {
  name?: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  domain?: string | null;
  defaultCurrency?: string;
  timezone?: string;
  primaryColor?: string | null;
};
export type UpdateSeoSettingsInput = z.infer<typeof updateSeoSettingsSchema>;
