"use server";

import { revalidatePath } from "next/cache";
import type { MediaType, WorkflowState } from "@prisma/client";

import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/auth";
import { landingPagePath, landingThankYouPath } from "@/lib/landing-page-url";
import { slugify } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getMediaStorage } from "@/providers/media";
import { mediaRepository } from "@/repositories/media.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) return { ok: false, error: error.message };
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Unexpected error" };
}

async function uniqueBlogSlug(
  organizationId: string,
  base: string,
  excludeId?: string,
) {
  let slug = base;
  let n = 1;
  while (
    await prisma.blogPost.findFirst({
      where: {
        organizationId,
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function uniqueLandingSlug(
  organizationId: string,
  base: string,
  excludeId?: string,
) {
  let slug = base;
  let n = 1;
  while (
    await prisma.landingPage.findFirst({
      where: {
        organizationId,
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function uniqueFormSlug(organizationId: string, base: string) {
  let slug = base;
  let n = 1;
  while (
    await prisma.form.findFirst({
      where: { organizationId, slug },
      select: { id: true },
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function mimeToMediaType(mime: string): MediaType {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime === "application/pdf") return "PDF";
  if (
    mime.includes("word") ||
    mime.includes("sheet") ||
    mime.includes("presentation") ||
    mime.startsWith("text/")
  ) {
    return "DOCUMENT";
  }
  return "OTHER";
}

export async function createFaqAction(input: {
  organizationId: string;
  question: string;
  answer: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:page");
    const question = input.question.trim();
    const answer = input.answer.trim();
    if (question.length < 3 || answer.length < 3) {
      throw new AppError("Question and answer are required", { status: 400 });
    }
    const faq = await prisma.faq.create({
      data: {
        organizationId: input.organizationId,
        question,
        answer,
      },
    });
    revalidatePath("/admin/faqs");
    revalidatePath("/contact");
    revalidatePath("/about");
    return { ok: true, data: { id: faq.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createTestimonialAction(input: {
  organizationId: string;
  authorName: string;
  authorRole?: string | null;
  content: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:page");
    const authorName = input.authorName.trim();
    const content = input.content.trim();
    if (authorName.length < 2 || content.length < 5) {
      throw new AppError("Author and content are required", { status: 400 });
    }
    const row = await prisma.testimonial.create({
      data: {
        organizationId: input.organizationId,
        authorName,
        authorRole: input.authorRole?.trim() || null,
        content,
      },
    });
    revalidatePath("/admin/testimonials");
    revalidatePath("/about");
    return { ok: true, data: { id: row.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createBlogPostAction(input: {
  organizationId: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  coverUrl?: string | null;
  publish?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:blog");
    const title = input.title.trim();
    if (title.length < 3) {
      throw new AppError("Title is required", { status: 400 });
    }
    const slug = await uniqueBlogSlug(
      input.organizationId,
      slugify(input.slug?.trim() || title),
    );
    const publish = Boolean(input.publish);
    const body = input.content?.trim() || "";
    const content = input.coverUrl?.trim()
      ? `<!--cover:${input.coverUrl.trim()}-->\n${body}`
      : body || null;

    const post = await prisma.blogPost.create({
      data: {
        organizationId: input.organizationId,
        title,
        slug,
        excerpt: input.excerpt?.trim() || null,
        content,
        metaTitle: input.metaTitle?.trim() || null,
        metaDescription: input.metaDescription?.trim() || null,
        canonicalUrl: input.canonicalUrl?.trim() || null,
        workflowState: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
      },
    });

    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${post.id}`);
    if (publish) {
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
    }
    return { ok: true, data: { id: post.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateBlogPostAction(input: {
  id: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  coverUrl?: string | null;
  workflowState?: WorkflowState;
  publish?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:blog");
    const existing = await prisma.blogPost.findFirst({
      where: { id: input.id, deletedAt: null },
    });
    if (!existing) throw new AppError("Post not found", { status: 404 });

    const title = input.title.trim();
    if (title.length < 3) {
      throw new AppError("Title is required", { status: 400 });
    }

    const slug = await uniqueBlogSlug(
      existing.organizationId,
      slugify(input.slug?.trim() || title),
      existing.id,
    );

    const publish = input.publish === true;
    const unpublish = input.workflowState === "DRAFT" && !publish;
    const workflowState: WorkflowState = publish
      ? "PUBLISHED"
      : (input.workflowState ?? existing.workflowState);

    let content = input.content?.trim() || null;
    if (input.coverUrl?.trim()) {
      const body = (content ?? "").replace(/^<!--cover:.*?-->\n?/, "");
      content = `<!--cover:${input.coverUrl.trim()}-->\n${body}`;
    }

    await prisma.blogPost.update({
      where: { id: existing.id },
      data: {
        title,
        slug,
        excerpt: input.excerpt?.trim() || null,
        content,
        metaTitle: input.metaTitle?.trim() || null,
        metaDescription: input.metaDescription?.trim() || null,
        canonicalUrl: input.canonicalUrl?.trim() || null,
        workflowState: unpublish ? "DRAFT" : workflowState,
        publishedAt: publish
          ? (existing.publishedAt ?? new Date())
          : unpublish
            ? null
            : existing.publishedAt,
      },
    });

    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${existing.id}`);
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    if (existing.slug !== slug) {
      revalidatePath(`/blog/${existing.slug}`);
    }
    return { ok: true, data: { id: existing.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createLandingPageAction(input: {
  organizationId: string;
  title: string;
  campaign?: string | null;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  campaignConfig?: unknown;
  publish?: boolean;
}): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requirePermission("cms:landing");
    const { parseCampaignConfig } = await import("@/types/landing-campaign");
    const title = input.title.trim();
    if (title.length < 3) {
      throw new AppError("Title is required", { status: 400 });
    }
    const slug = await uniqueLandingSlug(
      input.organizationId,
      slugify(input.slug?.trim() || title),
    );
    const publish = Boolean(input.publish);
    const config = parseCampaignConfig(input.campaignConfig);
    const page = await prisma.landingPage.create({
      data: {
        organizationId: input.organizationId,
        title,
        slug,
        campaign: input.campaign?.trim() || null,
        metaTitle: input.metaTitle?.trim() || config.hero.headline || title,
        metaDescription:
          input.metaDescription?.trim() ||
          config.overview.body.slice(0, 160) ||
          null,
        schemaJson: {
          ...config,
          seoKeywords: config.seoKeywords,
        } as object,
        workflowState: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        sections: {
          create: [
            {
              type: "HERO",
              name: "Hero",
              sortOrder: 0,
              isEnabled: true,
              config: {
                headline: config.hero.headline,
                bullets: config.hero.bullets,
                imageUrl: config.hero.imageUrl,
                primaryCta: config.hero.primaryCta,
                secondaryCta: config.hero.secondaryCta,
                formTitle: config.hero.formTitle,
              },
            },
            {
              type: "RICH_TEXT",
              name: "Overview",
              sortOrder: 1,
              isEnabled: true,
              config: config.overview,
            },
            {
              type: "STATISTICS",
              name: "Investment stats",
              sortOrder: 2,
              isEnabled: true,
              config: { stats: config.stats },
            },
            {
              type: "MAP",
              name: "Location",
              sortOrder: 3,
              isEnabled: true,
              config: config.location,
            },
            {
              type: "CUSTOM",
              name: "Pricing",
              sortOrder: 4,
              isEnabled: true,
              config: { pricing: config.pricing },
            },
            {
              type: "CUSTOM",
              name: "Highlights",
              sortOrder: 5,
              isEnabled: true,
              config: { highlights: config.highlights },
            },
            {
              type: "CUSTOM",
              name: "Amenities",
              sortOrder: 6,
              isEnabled: true,
              config: { amenities: config.amenities },
            },
            {
              type: "VIDEO",
              name: "Media",
              sortOrder: 7,
              isEnabled: true,
              config: config.media,
            },
            {
              type: "FAQ",
              name: "FAQ",
              sortOrder: 8,
              isEnabled: true,
              config: { faqs: config.faqs },
            },
            {
              type: "CTA",
              name: "Final CTA",
              sortOrder: 9,
              isEnabled: true,
              config: config.finalCta,
            },
          ],
        },
      },
    });
    revalidatePath("/admin/landing-pages");
    revalidatePath(`/admin/landing-pages/${page.id}`);
    revalidatePath(`/campaigns/${page.slug}`);
    revalidatePath(landingPagePath(page.slug));
    revalidatePath(landingThankYouPath(page.slug));
    revalidatePath("/dubai-projects");
    revalidatePath("/sitemap.xml");
    return { ok: true, data: { id: page.id, slug: page.slug } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateLandingPageAction(input: {
  id: string;
  title: string;
  campaign?: string | null;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  campaignConfig?: unknown;
  publish?: boolean;
  unpublish?: boolean;
}): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requirePermission("cms:landing");
    const { parseCampaignConfig } = await import("@/types/landing-campaign");
    const existing = await prisma.landingPage.findFirst({
      where: { id: input.id, deletedAt: null },
    });
    if (!existing) throw new AppError("Landing page not found", { status: 404 });

    const title = input.title.trim();
    if (title.length < 3) {
      throw new AppError("Title is required", { status: 400 });
    }
    const slug = await uniqueLandingSlug(
      existing.organizationId,
      slugify(input.slug?.trim() || title),
      existing.id,
    );
    const publish = Boolean(input.publish);
    const unpublish = Boolean(input.unpublish);
    const config = parseCampaignConfig(input.campaignConfig);

    await prisma.pageSection.deleteMany({
      where: { landingPageId: existing.id },
    });

    await prisma.landingPage.update({
      where: { id: existing.id },
      data: {
        title,
        slug,
        campaign: input.campaign?.trim() || null,
        metaTitle: input.metaTitle?.trim() || config.hero.headline || title,
        metaDescription:
          input.metaDescription?.trim() ||
          config.overview.body.slice(0, 160) ||
          null,
        schemaJson: config as object,
        workflowState: publish
          ? "PUBLISHED"
          : unpublish
            ? "DRAFT"
            : existing.workflowState,
        publishedAt: publish
          ? (existing.publishedAt ?? new Date())
          : unpublish
            ? null
            : existing.publishedAt,
        sections: {
          create: [
            {
              type: "HERO",
              name: "Hero",
              sortOrder: 0,
              config: {
                headline: config.hero.headline,
                bullets: config.hero.bullets,
                imageUrl: config.hero.imageUrl,
                primaryCta: config.hero.primaryCta,
                secondaryCta: config.hero.secondaryCta,
                formTitle: config.hero.formTitle,
              },
            },
            {
              type: "RICH_TEXT",
              name: "Overview",
              sortOrder: 1,
              config: config.overview,
            },
            {
              type: "STATISTICS",
              name: "Investment stats",
              sortOrder: 2,
              config: { stats: config.stats },
            },
            {
              type: "MAP",
              name: "Location",
              sortOrder: 3,
              config: config.location,
            },
            {
              type: "CUSTOM",
              name: "Pricing",
              sortOrder: 4,
              config: { pricing: config.pricing },
            },
            {
              type: "CUSTOM",
              name: "Highlights",
              sortOrder: 5,
              config: { highlights: config.highlights },
            },
            {
              type: "CUSTOM",
              name: "Amenities",
              sortOrder: 6,
              config: { amenities: config.amenities },
            },
            {
              type: "VIDEO",
              name: "Media",
              sortOrder: 7,
              config: config.media,
            },
            {
              type: "FAQ",
              name: "FAQ",
              sortOrder: 8,
              config: { faqs: config.faqs },
            },
            {
              type: "CTA",
              name: "Final CTA",
              sortOrder: 9,
              config: config.finalCta,
            },
          ],
        },
      },
    });

    revalidatePath("/admin/landing-pages");
    revalidatePath(`/admin/landing-pages/${existing.id}`);
    revalidatePath(`/campaigns/${slug}`);
    revalidatePath(landingPagePath(slug));
    revalidatePath(landingThankYouPath(slug));
    revalidatePath("/dubai-projects");
    revalidatePath("/sitemap.xml");
    if (existing.slug !== slug) {
      revalidatePath(`/campaigns/${existing.slug}`);
      revalidatePath(landingPagePath(existing.slug));
      revalidatePath(landingThankYouPath(existing.slug));
    }
    return { ok: true, data: { id: existing.id, slug } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createFormDefinitionAction(input: {
  organizationId: string;
  name: string;
  description?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:form");
    const name = input.name.trim();
    if (name.length < 2) {
      throw new AppError("Name is required", { status: 400 });
    }
    const slug = await uniqueFormSlug(input.organizationId, slugify(name));
    const form = await prisma.form.create({
      data: {
        organizationId: input.organizationId,
        name,
        slug,
        description: input.description?.trim() || null,
        isActive: true,
        fields: {
          create: [
            {
              name: "full_name",
              label: "Full name",
              type: "TEXT",
              isRequired: true,
              sortOrder: 0,
            },
            {
              name: "email",
              label: "Email",
              type: "EMAIL",
              isRequired: false,
              sortOrder: 1,
            },
            {
              name: "phone",
              label: "Phone",
              type: "PHONE",
              isRequired: true,
              sortOrder: 2,
            },
            {
              name: "message",
              label: "Message",
              type: "TEXTAREA",
              isRequired: false,
              sortOrder: 3,
            },
          ],
        },
      },
    });
    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${form.id}`);
    return { ok: true, data: { id: form.id } };
  } catch (error) {
    return toActionError(error);
  }
}

const FORM_FIELD_TYPES = [
  "TEXT",
  "EMAIL",
  "PHONE",
  "TEXTAREA",
  "SELECT",
  "NUMBER",
  "CHECKBOX",
  "HIDDEN",
] as const;

export async function createFormFieldAction(input: {
  formId: string;
  label: string;
  type: string;
  isRequired?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:form");
    const form = await prisma.form.findFirst({
      where: { id: input.formId, deletedAt: null },
      include: { _count: { select: { fields: true } } },
    });
    if (!form) throw new AppError("Form not found", { status: 404 });

    const label = input.label.trim();
    if (label.length < 1) {
      throw new AppError("Label is required", { status: 400 });
    }
    const type = FORM_FIELD_TYPES.includes(
      input.type as (typeof FORM_FIELD_TYPES)[number],
    )
      ? (input.type as (typeof FORM_FIELD_TYPES)[number])
      : "TEXT";

    const nameBase = slugify(label).replace(/-/g, "_") || "field";
    let name = nameBase;
    let n = 1;
    while (
      await prisma.formField.findFirst({
        where: { formId: form.id, name, deletedAt: null },
      })
    ) {
      n += 1;
      name = `${nameBase}_${n}`;
    }

    const field = await prisma.formField.create({
      data: {
        formId: form.id,
        name,
        label,
        type,
        isRequired: Boolean(input.isRequired),
        sortOrder: form._count.fields,
      },
    });
    revalidatePath(`/admin/forms/${form.id}`);
    revalidatePath("/admin/forms");
    return { ok: true, data: { id: field.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteFormFieldAction(input: {
  fieldId: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:form");
    const field = await prisma.formField.findFirst({
      where: { id: input.fieldId, deletedAt: null },
    });
    if (!field) throw new AppError("Field not found", { status: 404 });
    await prisma.formField.update({
      where: { id: field.id },
      data: { deletedAt: new Date() },
    });
    revalidatePath(`/admin/forms/${field.formId}`);
    revalidatePath("/admin/forms");
    return { ok: true, data: { id: field.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function toggleFormActiveAction(input: {
  formId: string;
  isActive: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("cms:form");
    const form = await prisma.form.update({
      where: { id: input.formId },
      data: { isActive: input.isActive },
    });
    revalidatePath(`/admin/forms/${form.id}`);
    revalidatePath("/admin/forms");
    return { ok: true, data: { id: form.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function submitPublicFormAction(input: {
  formId: string;
  payload: Record<string, string>;
  meta?: { ipAddress?: string | null; userAgent?: string | null };
}): Promise<ActionResult<{ submissionId: string; leadId?: string }>> {
  try {
    const form = await prisma.form.findFirst({
      where: { id: input.formId, deletedAt: null, isActive: true },
      include: {
        fields: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!form) throw new AppError("Form not found", { status: 404 });

    for (const field of form.fields) {
      if (field.isRequired && !String(input.payload[field.name] ?? "").trim()) {
        throw new AppError(`${field.label} is required`, { status: 422 });
      }
    }

    const name =
      input.payload.full_name?.trim() ||
      input.payload.name?.trim() ||
      "Website enquiry";
    const email = input.payload.email?.trim() || null;
    const phone = input.payload.phone?.trim() || null;
    const notes =
      input.payload.message?.trim() ||
      input.payload.notes?.trim() ||
      null;

    let leadId: string | undefined;
    if (phone) {
      const { leadService } = await import("@/services/lead.service");
      const lead = await leadService.capture(
        {
          name,
          email,
          phone,
          notes: notes ?? undefined,
          organizationId: form.organizationId,
          formId: form.id,
          leadSource: `form:${form.slug}`,
        },
        {
          ipAddress: input.meta?.ipAddress ?? null,
          userAgent: input.meta?.userAgent ?? null,
        },
      );
      leadId = lead.id;
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        payload: input.payload,
        leadId: leadId ?? null,
        ipAddress: input.meta?.ipAddress ?? undefined,
        userAgent: input.meta?.userAgent ?? undefined,
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        organizationId: form.organizationId,
        type: "FORM_SUBMIT",
        path: `/forms/${form.slug}`,
        metadata: { formId: form.id, submissionId: submission.id, leadId },
      },
    });

    revalidatePath(`/admin/forms/${form.id}`);
    return {
      ok: true,
      data: { submissionId: submission.id, leadId },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function uploadMediaLibraryAction(
  formData: FormData,
): Promise<ActionResult<{ ids: string[]; urls: string[] }>> {
  try {
    await requirePermission("media:upload");
    const org = await organizationRepository.getDefault();
    if (!org) throw new AppError("Organization not found", { status: 404 });

    const files = formData.getAll("files").filter(
      (f): f is File => typeof File !== "undefined" && f instanceof File,
    );
    const alt = String(formData.get("alt") ?? "").trim() || null;
    const title = String(formData.get("title") ?? "").trim() || null;

    if (files.length === 0) {
      throw new AppError("No files selected", { status: 400 });
    }
    if (files.length > 20) {
      throw new AppError("Upload up to 20 files at once", { status: 400 });
    }

    const ids: string[] = [];
    const urls: string[] = [];

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        throw new AppError(`${file.name} exceeds 20MB`, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await getMediaStorage().upload({
        organizationId: org.id,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        body: buffer,
        folder: "library",
      });
      const type = mimeToMediaType(file.type || "application/octet-stream");
      const asset = await mediaRepository.createAsset({
        organizationId: org.id,
        type,
        filename: uploaded.storageKey.split("/").pop() || file.name,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: uploaded.sizeBytes,
        storageKey: uploaded.storageKey,
        url: uploaded.url,
        alt,
        title: title || file.name,
      });
      ids.push(asset.id);
      urls.push(asset.url);
    }

    revalidatePath("/admin/media");
    return { ok: true, data: { ids, urls } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteMediaAssetAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission("media:delete");
    await mediaRepository.softDeleteAsset(id);
    revalidatePath("/admin/media");
    return { ok: true, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}
