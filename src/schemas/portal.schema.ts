import { z } from "zod";

/** "" and undefined both mean "clear this field". */
const blankToNull = z
  .union([z.string(), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

const tagList = z
  .union([z.string(), z.array(z.string()), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return [] as string[];
    const parts = Array.isArray(value) ? value : value.split(/[,|\n]/);
    return [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  });

const optionalNumber = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

/**
 * Fields an agent may change on their own public profile. Name, slug,
 * visibility, featuring and display order stay with staff so nobody can
 * rename themselves off the roster or promote their own card.
 */
export const portalProfileSchema = z.object({
  title: blankToNull,
  email: blankToNull.refine(
    (value) => value == null || z.string().email().safeParse(value).success,
    { message: "Enter a valid email address" },
  ),
  phone: blankToNull,
  whatsapp: blankToNull,
  bio: blankToNull,
  photoUrl: blankToNull,
  photoMediaId: blankToNull,
  languages: tagList,
  specialties: tagList,
  serviceAreas: tagList,
  reraNumber: blankToNull,
  yearsExperience: optionalNumber.refine(
    (value) => value == null || (value >= 0 && value <= 60),
    { message: "Years of experience must be between 0 and 60" },
  ),
  note: blankToNull,
});

export type PortalProfileInput = z.infer<typeof portalProfileSchema>;

/** The listing fields an agent fills in. Maps onto the manual upload schema. */
export const portalListingSchema = z.object({
  propertyId: blankToNull,
  name: z.string().trim().min(3, "Give the listing a name").max(200),
  propertyTypeName: blankToNull,
  categoryName: blankToNull,
  description: blankToNull,
  shortDescription: blankToNull,
  cityName: blankToNull,
  areaName: blankToNull,
  communityName: blankToNull,
  addressLine: blankToNull,
  developerName: blankToNull,
  currency: z.string().trim().min(3).max(8).optional().default("AED"),
  price: optionalNumber,
  maxPrice: optionalNumber,
  bedrooms: optionalNumber,
  minSize: optionalNumber,
  maxSize: optionalNumber,
  completionLabel: blankToNull,
  saleStatus: blankToNull,
  amenities: tagList,
  coverImageUrl: blankToNull,
  galleryUrls: tagList,
  youtubeUrl: blankToNull,
  metaTitle: blankToNull,
  metaDescription: blankToNull,
  note: blankToNull,
});

export type PortalListingInput = z.infer<typeof portalListingSchema>;

export const portalPostSchema = z.object({
  postId: blankToNull,
  title: z.string().trim().min(3, "Give the post a title").max(200),
  excerpt: blankToNull,
  content: blankToNull,
  coverUrl: blankToNull,
  metaTitle: blankToNull,
  metaDescription: blankToNull,
  note: blankToNull,
});

export type PortalPostInput = z.infer<typeof portalPostSchema>;

export const submitForReviewSchema = z.object({
  submissionId: z.string().min(1),
});

export const withdrawSubmissionSchema = submitForReviewSchema;

export const reviewDecisionSchema = z.object({
  submissionId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  reviewNote: blankToNull,
  /** Only used when approving an access request. */
  agentId: blankToNull,
});

export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;

export const portalAccessRequestSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: blankToNull,
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(200, "That password is too long"),
  reraNumber: blankToNull,
  note: blankToNull,
});

export type PortalAccessRequestInput = z.infer<typeof portalAccessRequestSchema>;

export const SUBMISSION_STATUS_FILTERS = [
  "pending",
  "approved",
  "rejected",
  "all",
] as const;

export type SubmissionStatusFilter = (typeof SUBMISSION_STATUS_FILTERS)[number];

export const listSubmissionsQuerySchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(SUBMISSION_STATUS_FILTERS).optional().default("pending"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
