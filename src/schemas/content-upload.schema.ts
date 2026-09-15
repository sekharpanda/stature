import { z } from "zod";

import { slugSchema } from "@/schemas/catalog.schema";

const optionalUrl = z
  .union([
    z.string().url(),
    z.string().regex(/^\/uploads\//),
    z.literal(""),
  ])
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

const stringList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null || v === "") return [] as string[];
    if (Array.isArray(v)) return v.map((s) => s.trim()).filter(Boolean);
    return v
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  });

export const contentBlogPostJsonSchema = z.object({
  title: z.string().min(3).max(200),
  slug: slugSchema.optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  coverUrl: optionalUrl,
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  canonicalUrl: optionalUrl,
  publish: z.boolean().optional().default(false),
});

export const contentAgentJsonSchema = z.object({
  name: z.string().min(2).max(160),
  slug: slugSchema.optional(),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  title: z.string().max(120).optional().nullable(),
  bio: z.string().max(4000).optional().nullable(),
  photoUrl: optionalUrl,
  specialties: stringList,
  languages: stringList,
  serviceAreas: stringList,
  reraNumber: z.string().max(80).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
});

export const contentDeveloperJsonSchema = z.object({
  name: z.string().min(2).max(160),
  slug: slugSchema.optional(),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().optional().nullable(),
  website: optionalUrl,
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  phone: z.string().max(40).optional().nullable(),
  logoUrl: optionalUrl,
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
  headquarters: z.string().max(160).optional().nullable(),
  investmentHighlights: z.string().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  isPublished: z.boolean().optional().default(true),
});

export const contentAreaJsonSchema = z.object({
  name: z.string().min(2).max(160),
  slug: slugSchema.optional(),
  /** Defaults to Dubai if omitted */
  cityName: z.string().max(120).optional().nullable(),
  citySlug: z.string().max(160).optional().nullable(),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  investmentHighlights: z.string().optional().nullable(),
  rentalYield: z.number().optional().nullable(),
  averageRoi: z.number().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(180).optional().nullable(),
  isPublished: z.boolean().optional().default(true),
});

export const contentFaqJsonSchema = z.object({
  question: z.string().min(3).max(500),
  answer: z.string().min(3),
  sortOrder: z.number().int().optional().default(0),
});

export const contentTestimonialJsonSchema = z.object({
  authorName: z.string().min(2).max(160),
  authorRole: z.string().max(160).optional().nullable(),
  content: z.string().min(3),
  rating: z.number().min(1).max(5).optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export const contentImportEnvelopeSchema = z
  .object({
    blogPosts: z.array(contentBlogPostJsonSchema).max(50).optional(),
    agents: z.array(contentAgentJsonSchema).max(50).optional(),
    developers: z.array(contentDeveloperJsonSchema).max(50).optional(),
    areas: z.array(contentAreaJsonSchema).max(50).optional(),
    faqs: z.array(contentFaqJsonSchema).max(100).optional(),
    testimonials: z.array(contentTestimonialJsonSchema).max(50).optional(),
  })
  .refine(
    (v) =>
      (v.blogPosts?.length ?? 0) +
        (v.agents?.length ?? 0) +
        (v.developers?.length ?? 0) +
        (v.areas?.length ?? 0) +
        (v.faqs?.length ?? 0) +
        (v.testimonials?.length ?? 0) >
      0,
    { message: "JSON must include at least one content array with items" },
  );

export type ContentImportEnvelope = z.infer<typeof contentImportEnvelopeSchema>;

export const CONTENT_JSON_SAMPLE = `{
  "blogPosts": [
    {
      "title": "Dubai off-plan outlook 2026",
      "slug": "dubai-off-plan-outlook-2026",
      "excerpt": "Where end-user demand is strongest this year.",
      "content": "<p>Write your full article HTML or markdown-friendly text here.</p>",
      "coverUrl": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
      "publish": true,
      "metaTitle": "Dubai Off-Plan Outlook 2026",
      "metaDescription": "Market insights for buyers and investors across Dubai communities."
    }
  ],
  "agents": [
    {
      "name": "Ateeq Rahman",
      "slug": "ateeq-rahman",
      "title": "Senior Property Consultant",
      "email": "ateeq@prowinproperties.com",
      "phone": "+971585808989",
      "whatsapp": "+971585808989",
      "photoUrl": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
      "bio": "Helping buyers secure off-plan and ready homes across Dubai.",
      "specialties": ["Off-plan", "Investment"],
      "languages": ["English", "Hindi", "Urdu"],
      "serviceAreas": ["Business Bay", "JVC", "Dubai South"],
      "reraNumber": "12345",
      "yearsExperience": 8,
      "isFeatured": true,
      "isActive": true
    }
  ],
  "developers": [
    {
      "name": "Example Developments",
      "slug": "example-developments",
      "shortDescription": "Master-planned communities across Dubai.",
      "website": "https://example.com",
      "headquarters": "Dubai, UAE",
      "foundedYear": 2005,
      "isPublished": true
    }
  ],
  "areas": [
    {
      "name": "Business Bay",
      "slug": "business-bay",
      "cityName": "Dubai",
      "shortDescription": "Central waterfront district for apartments and offices.",
      "isPublished": true
    }
  ],
  "faqs": [
    {
      "question": "Do you help with off-plan payment plans?",
      "answer": "Yes. We explain developer payment plans and help you compare options."
    }
  ],
  "testimonials": [
    {
      "authorName": "Pranay Nair",
      "authorRole": "Buyer · Business Bay",
      "content": "Clear advice and a smooth purchase process from first call to handover.",
      "rating": 5,
      "isFeatured": true
    }
  ]
}`;
