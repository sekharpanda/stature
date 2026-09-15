import { z } from "zod";

import { slugSchema } from "@/schemas/catalog.schema";

export const createFaqSchema = z.object({
  organizationId: z.string().min(1),
  question: z.string().min(3).max(500),
  answer: z.string().min(3),
});

export const createTestimonialSchema = z.object({
  organizationId: z.string().min(1),
  authorName: z.string().min(2).max(160),
  authorRole: z.string().max(160).optional().nullable(),
  content: z.string().min(3),
});

export const createBlogPostSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(2).max(200),
  slug: slugSchema.optional(),
  excerpt: z.string().max(500).optional().nullable(),
});

export const createLandingPageSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(2).max(200),
  slug: slugSchema.optional(),
  campaign: z.string().max(120).optional().nullable(),
});

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type CreateLandingPageInput = z.infer<typeof createLandingPageSchema>;
