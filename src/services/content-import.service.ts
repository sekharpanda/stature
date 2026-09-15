import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  contentImportEnvelopeSchema,
  type ContentImportEnvelope,
} from "@/schemas/content-upload.schema";

type ImportCounts = {
  blogPosts: number;
  agents: number;
  developers: number;
  areas: number;
  faqs: number;
  testimonials: number;
};

type ImportResult = {
  counts: ImportCounts;
  created: {
    blogPosts: Array<{ id: string; slug: string; title: string }>;
    agents: Array<{ id: string; slug: string; name: string }>;
    developers: Array<{ id: string; slug: string; name: string }>;
    areas: Array<{ id: string; slug: string; name: string }>;
    faqs: Array<{ id: string; question: string }>;
    testimonials: Array<{ id: string; authorName: string }>;
  };
  errors: string[];
};

async function uniqueSlug(
  organizationId: string,
  model: "blogPost" | "agent" | "developer" | "area",
  base: string,
) {
  let slug = base || "item";
  let n = 1;
  for (;;) {
    const existing =
      model === "blogPost"
        ? await prisma.blogPost.findFirst({
            where: { organizationId, slug, deletedAt: null },
            select: { id: true },
          })
        : model === "agent"
          ? await prisma.agent.findFirst({
              where: { organizationId, slug, deletedAt: null },
              select: { id: true },
            })
          : model === "developer"
            ? await prisma.developer.findFirst({
                where: { organizationId, slug, deletedAt: null },
                select: { id: true },
              })
            : await prisma.area.findFirst({
                where: { organizationId, slug, deletedAt: null },
                select: { id: true },
              });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function resolveCityId(
  organizationId: string,
  cityName?: string | null,
  citySlug?: string | null,
) {
  const slug = citySlug?.trim() || slugify(cityName?.trim() || "dubai");
  const name = cityName?.trim() || "Dubai";

  const existing = await prisma.city.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const country =
    (await prisma.country.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { slug: "uae" },
          { name: { equals: "United Arab Emirates", mode: "insensitive" } },
          { isoCode: "AE" },
        ],
      },
      select: { id: true },
    })) ??
    (await prisma.country.create({
      data: {
        organizationId,
        name: "United Arab Emirates",
        slug: "uae",
        isoCode: "AE",
      },
      select: { id: true },
    }));

  const city = await prisma.city.create({
    data: {
      organizationId,
      countryId: country.id,
      name,
      slug,
    },
    select: { id: true },
  });
  return city.id;
}

/**
 * Bulk-create marketing content from a JSON envelope.
 * Supports blogPosts, agents, developers, areas, faqs, testimonials.
 */
export const contentImportService = {
  async importJson(raw: unknown): Promise<ImportResult> {
    await requirePermission("cms:blog");

    const org = await organizationRepository.getDefault();
    if (!org) {
      throw new AppError("Organization not configured", { status: 500 });
    }

    let parsed: ContentImportEnvelope;
    try {
      parsed = contentImportEnvelopeSchema.parse(raw);
    } catch (error) {
      throw new AppError("Invalid content JSON", {
        status: 422,
        details: error,
      });
    }

    const result: ImportResult = {
      counts: {
        blogPosts: 0,
        agents: 0,
        developers: 0,
        areas: 0,
        faqs: 0,
        testimonials: 0,
      },
      created: {
        blogPosts: [],
        agents: [],
        developers: [],
        areas: [],
        faqs: [],
        testimonials: [],
      },
      errors: [],
    };

    for (const item of parsed.blogPosts ?? []) {
      try {
        const base = slugify(item.slug || item.title);
        const slug = await uniqueSlug(org.id, "blogPost", base);
        const body = item.content?.trim() || "";
        const content = item.coverUrl?.trim()
          ? `<!--cover:${item.coverUrl.trim()}-->\n${body}`
          : body || null;
        const publish = Boolean(item.publish);
        const post = await prisma.blogPost.create({
          data: {
            organizationId: org.id,
            title: item.title.trim(),
            slug,
            excerpt: item.excerpt?.trim() || null,
            content,
            metaTitle: item.metaTitle?.trim() || null,
            metaDescription: item.metaDescription?.trim() || null,
            canonicalUrl: item.canonicalUrl?.trim() || null,
            workflowState: publish ? "PUBLISHED" : "DRAFT",
            publishedAt: publish ? new Date() : null,
          },
          select: { id: true, slug: true, title: true },
        });
        result.created.blogPosts.push(post);
        result.counts.blogPosts += 1;
      } catch (error) {
        result.errors.push(
          `blogPosts “${item.title}”: ${error instanceof Error ? error.message : "failed"}`,
        );
      }
    }

    for (const item of parsed.agents ?? []) {
      try {
        const base = slugify(item.slug || item.name);
        const slug = await uniqueSlug(org.id, "agent", base);
        const agent = await prisma.agent.create({
          data: {
            organizationId: org.id,
            name: item.name.trim(),
            slug,
            email: item.email ?? null,
            phone: item.phone?.trim() || null,
            whatsapp: item.whatsapp?.trim() || null,
            title: item.title?.trim() || null,
            bio: item.bio?.trim() || null,
            photoUrl: item.photoUrl ?? null,
            specialties: item.specialties ?? [],
            languages: item.languages ?? [],
            serviceAreas: item.serviceAreas ?? [],
            reraNumber: item.reraNumber?.trim() || null,
            yearsExperience: item.yearsExperience ?? null,
            isActive: item.isActive ?? true,
            isFeatured: item.isFeatured ?? false,
            sortOrder: item.sortOrder ?? 0,
            metaTitle: item.metaTitle?.trim() || null,
            metaDescription: item.metaDescription?.trim() || null,
          },
          select: { id: true, slug: true, name: true },
        });
        result.created.agents.push(agent);
        result.counts.agents += 1;
      } catch (error) {
        result.errors.push(
          `agents “${item.name}”: ${error instanceof Error ? error.message : "failed"}`,
        );
      }
    }

    for (const item of parsed.developers ?? []) {
      try {
        const base = slugify(item.slug || item.name);
        const slug = await uniqueSlug(org.id, "developer", base);
        const developer = await prisma.developer.create({
          data: {
            organizationId: org.id,
            name: item.name.trim(),
            slug,
            shortDescription: item.shortDescription?.trim() || null,
            description: item.description?.trim() || null,
            website: item.website ?? null,
            email: item.email ?? null,
            phone: item.phone?.trim() || null,
            logoUrl: item.logoUrl ?? null,
            foundedYear: item.foundedYear ?? null,
            headquarters: item.headquarters?.trim() || null,
            investmentHighlights: item.investmentHighlights?.trim() || null,
            metaTitle: item.metaTitle?.trim() || null,
            metaDescription: item.metaDescription?.trim() || null,
            isPublished: item.isPublished ?? true,
          },
          select: { id: true, slug: true, name: true },
        });
        result.created.developers.push(developer);
        result.counts.developers += 1;
      } catch (error) {
        result.errors.push(
          `developers “${item.name}”: ${error instanceof Error ? error.message : "failed"}`,
        );
      }
    }

    for (const item of parsed.areas ?? []) {
      try {
        const cityId = await resolveCityId(
          org.id,
          item.cityName,
          item.citySlug,
        );
        const base = slugify(item.slug || item.name);
        const slug = await uniqueSlug(org.id, "area", base);
        const area = await prisma.area.create({
          data: {
            organizationId: org.id,
            cityId,
            name: item.name.trim(),
            slug,
            shortDescription: item.shortDescription?.trim() || null,
            description: item.description?.trim() || null,
            latitude: item.latitude ?? null,
            longitude: item.longitude ?? null,
            investmentHighlights: item.investmentHighlights?.trim() || null,
            rentalYield: item.rentalYield ?? null,
            averageRoi: item.averageRoi ?? null,
            metaTitle: item.metaTitle?.trim() || null,
            metaDescription: item.metaDescription?.trim() || null,
            isPublished: item.isPublished ?? true,
          },
          select: { id: true, slug: true, name: true },
        });
        result.created.areas.push(area);
        result.counts.areas += 1;
      } catch (error) {
        result.errors.push(
          `areas “${item.name}”: ${error instanceof Error ? error.message : "failed"}`,
        );
      }
    }

    for (const item of parsed.faqs ?? []) {
      try {
        const faq = await prisma.faq.create({
          data: {
            organizationId: org.id,
            question: item.question.trim(),
            answer: item.answer.trim(),
            sortOrder: item.sortOrder ?? 0,
          },
          select: { id: true, question: true },
        });
        result.created.faqs.push(faq);
        result.counts.faqs += 1;
      } catch (error) {
        result.errors.push(
          `faqs “${item.question.slice(0, 40)}”: ${error instanceof Error ? error.message : "failed"}`,
        );
      }
    }

    for (const item of parsed.testimonials ?? []) {
      try {
        const testimonial = await prisma.testimonial.create({
          data: {
            organizationId: org.id,
            authorName: item.authorName.trim(),
            authorRole: item.authorRole?.trim() || null,
            content: item.content.trim(),
            rating: item.rating ?? null,
            isFeatured: item.isFeatured ?? false,
            sortOrder: item.sortOrder ?? 0,
          },
          select: { id: true, authorName: true },
        });
        result.created.testimonials.push(testimonial);
        result.counts.testimonials += 1;
      } catch (error) {
        result.errors.push(
          `testimonials “${item.authorName}”: ${error instanceof Error ? error.message : "failed"}`,
        );
      }
    }

    return result;
  },
};
