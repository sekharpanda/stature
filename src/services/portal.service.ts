import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { getSession, getUserPermissionKeys, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { embedBlogCover, splitBlogCover } from "@/lib/blog-content";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { agentRepository } from "@/repositories/agent.repository";
import { propertyRepository } from "@/repositories/property.repository";
import { submissionRepository } from "@/repositories/submission.repository";
import {
  portalListingSchema,
  portalPostSchema,
  portalProfileSchema,
  type PortalListingInput,
  type PortalPostInput,
} from "@/schemas/portal.schema";
import { propertyService } from "@/services/property.service";
import { diffFields, submissionService } from "@/services/submission.service";

const PROFILE_LABELS: Record<string, string> = {
  title: "Role",
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  bio: "Bio",
  photoUrl: "Photo",
  languages: "Languages",
  specialties: "Specialties",
  serviceAreas: "Areas covered",
  reraNumber: "RERA number",
  yearsExperience: "Years of experience",
};

const LISTING_LABELS: Record<string, string> = {
  name: "Listing name",
  propertyTypeName: "Property type",
  categoryName: "Category",
  developerName: "Developer",
  cityName: "City",
  areaName: "Area",
  communityName: "Community",
  addressLine: "Address",
  currency: "Currency",
  price: "Price from",
  maxPrice: "Price to",
  bedrooms: "Bedrooms",
  minSize: "Size from",
  maxSize: "Size to",
  completionLabel: "Handover",
  saleStatus: "Sale status",
  shortDescription: "Summary",
  description: "Description",
  amenities: "Amenities",
  coverImageUrl: "Cover photo",
  galleryUrls: "Gallery",
  youtubeUrl: "Video",
  metaTitle: "Meta title",
  metaDescription: "Meta description",
};

const POST_LABELS: Record<string, string> = {
  title: "Title",
  excerpt: "Excerpt",
  content: "Body",
  coverUrl: "Cover image",
  metaTitle: "Meta title",
  metaDescription: "Meta description",
};

export type PortalContext = {
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  agent: NonNullable<Awaited<ReturnType<typeof agentRepository.findByUserId>>>;
  permissions: string[];
};

/**
 * Every portal read and write goes through here: it proves there is a session,
 * that the session has portal access, and that a consultant profile is linked.
 */
export async function requirePortalContext(): Promise<PortalContext> {
  const session = await requirePermission("portal:access");
  const agent = await agentRepository.findByUserId(session.user.id);
  if (!agent) {
    throw new ForbiddenError(
      "No consultant profile is linked to this login yet. Ask an administrator to connect it in Admin → Agents.",
    );
  }
  const permissions = await getUserPermissionKeys(session.user.id);
  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    organizationId: agent.organizationId,
    agent,
    permissions,
  };
}

/**
 * For portal pages. Next renders layout and page in parallel, so a page that
 * threw here would race the layout's redirect and surface an error boundary;
 * redirecting from both keeps the outcome the same either way.
 */
export async function requirePortalPageContext(): Promise<PortalContext> {
  const context = await getPortalContext();
  if (context) return context;

  const session = await getSession();
  if (!session?.user?.id) redirect("/login?next=/admin/my");

  const permissions = await getUserPermissionKeys(session.user.id);
  redirect(permissions.includes("dashboard:view") ? "/admin" : "/access-pending");
}

/** Null instead of throwing, for nav and landing decisions. */
export async function getPortalContext(): Promise<PortalContext | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const permissions = await getUserPermissionKeys(session.user.id);
  if (!permissions.includes("portal:access")) return null;
  const agent = await agentRepository.findByUserId(session.user.id);
  if (!agent) return null;
  return {
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    organizationId: agent.organizationId,
    agent,
    permissions,
  };
}

function profileFormValues(agent: PortalContext["agent"]) {
  return {
    title: agent.title,
    email: agent.email,
    phone: agent.phone,
    whatsapp: agent.whatsapp,
    bio: agent.bio,
    photoUrl: agent.photoUrl,
    photoMediaId: agent.photoMediaId,
    languages: agent.languages,
    specialties: agent.specialties,
    serviceAreas: agent.serviceAreas,
    reraNumber: agent.reraNumber,
    yearsExperience: agent.yearsExperience,
  };
}

type OwnedProperty = NonNullable<
  Awaited<ReturnType<typeof propertyRepository.findOwnedByAgent>>
>;

/** Property row → the shape the portal form and the diff both speak. */
export function listingFormValues(property: OwnedProperty) {
  const details = (property.details ?? {}) as Record<string, unknown>;
  const cover = property.images.find((image) => image.isCover) ?? property.images[0];
  const gallery = property.images
    .filter((image) => image.url !== cover?.url)
    .map((image) => image.url);

  const toNumber = (value: Prisma.Decimal | null) =>
    value == null ? null : Number(value.toString());

  return {
    propertyId: property.id,
    name: property.name,
    propertyTypeName: property.propertyType?.name ?? null,
    categoryName: property.category?.name ?? null,
    developerName: property.developer?.name ?? null,
    cityName: property.city?.name ?? null,
    areaName: property.area?.name ?? null,
    communityName: property.community?.name ?? null,
    addressLine: property.address?.locality ?? null,
    currency: property.currency,
    price: toNumber(property.minPrice),
    maxPrice: toNumber(property.maxPrice),
    bedrooms: typeof details.bedrooms === "number" ? details.bedrooms : null,
    minSize: toNumber(property.minSize),
    maxSize: toNumber(property.maxSize),
    completionLabel: property.completionLabel,
    saleStatus: property.saleStatus,
    shortDescription: property.shortDescription,
    description: property.description,
    amenities: property.amenities.map((row) => row.amenity.name),
    coverImageUrl: cover?.url ?? null,
    galleryUrls: gallery,
    youtubeUrl: typeof details.youtubeUrl === "string" ? details.youtubeUrl : null,
    metaTitle: null as string | null,
    metaDescription: null as string | null,
  };
}

/** The reviewable values, without the workflow-only fields. */
function listingPayload(input: PortalListingInput) {
  const values: Record<string, unknown> = { ...input };
  delete values.note;
  delete values.propertyId;
  return values;
}

export const portalService = {
  async overview() {
    const context = await requirePortalPageContext();
    const [listings, posts, submissions] = await Promise.all([
      propertyRepository.listByAgent(context.organizationId, context.agent.id, {
        pageSize: 5,
      }),
      prisma.blogPost.findMany({
        where: { authorId: context.userId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          workflowState: true,
          updatedAt: true,
        },
      }),
      submissionRepository.listForSubmitter(context.userId, 8),
    ]);

    const liveListings = await prisma.property.count({
      where: {
        organizationId: context.organizationId,
        agentId: context.agent.id,
        status: "PUBLISHED",
        deletedAt: null,
      },
    });

    return {
      context,
      listings,
      posts,
      submissions,
      stats: {
        listingsTotal: listings.total,
        listingsLive: liveListings,
        postsTotal: posts.length,
        pending: submissions.filter((row) => row.status === "PENDING").length,
      },
    };
  },

  // ---------------------------------------------------------------- profile

  async profileView() {
    const context = await requirePortalPageContext();
    const pending = await submissionRepository.findPending(
      "AGENT_PROFILE",
      context.agent.id,
    );
    return {
      context,
      agent: context.agent,
      values: profileFormValues(context.agent),
      pending,
      pendingChanges: (pending?.changes as unknown[] | null) ?? [],
    };
  },

  async submitProfile(raw: unknown) {
    const context = await requirePortalContext();
    await requirePermission("portal:profile");

    const input = portalProfileSchema.parse(raw);
    const { note, ...values } = input;
    const before = profileFormValues(context.agent);
    const changes = diffFields(before, values, PROFILE_LABELS);

    if (changes.length === 0) {
      throw new AppError("Nothing has changed yet", { status: 400 });
    }

    const submission = await submissionService.open({
      organizationId: context.organizationId,
      entityType: "AGENT_PROFILE",
      entityId: context.agent.id,
      kind: "UPDATE",
      title: `${context.agent.name} — profile update`,
      payload: values as Prisma.InputJsonValue,
      changes: changes as unknown as Prisma.InputJsonValue,
      note,
      submittedById: context.userId,
      actorName: context.agent.name,
    });

    return { submissionId: submission.id, changes };
  },

  // --------------------------------------------------------------- listings

  async listListings({ page = 1 }: { page?: number } = {}) {
    const context = await requirePortalPageContext();
    const result = await propertyRepository.listByAgent(
      context.organizationId,
      context.agent.id,
      { page, pageSize: 20 },
    );
    const pending = await submissionRepository.pendingByEntityIds(
      "PROPERTY",
      result.items.map((item) => item.id),
    );
    return { context, ...result, pending };
  },

  async getListing(propertyId: string) {
    const context = await requirePortalPageContext();
    const property = await propertyRepository.findOwnedByAgent(
      context.organizationId,
      context.agent.id,
      propertyId,
    );
    if (!property) throw new NotFoundError("Listing not found");

    const pending = await submissionRepository.findPending("PROPERTY", property.id);
    const live = property.status === "PUBLISHED";
    const stored = listingFormValues(property);
    const pendingPayload = (pending?.payload as Record<string, unknown> | null) ?? null;

    return {
      context,
      property,
      live,
      pending,
      pendingChanges: (pending?.changes as unknown[] | null) ?? [],
      // Show the agent what they last submitted, not the stale live copy.
      values: pendingPayload ? { ...stored, ...pendingPayload } : stored,
    };
  },

  /**
   * Saves a listing. An unapproved listing is written straight to its hidden
   * draft; a live one keeps serving the approved version while the edit waits
   * in the queue.
   */
  async saveListing(raw: unknown, options: { submit: boolean }) {
    const context = await requirePortalContext();
    await requirePermission("portal:property");

    const input = portalListingSchema.parse(raw);
    const existing = input.propertyId
      ? await propertyRepository.findOwnedByAgent(
          context.organizationId,
          context.agent.id,
          input.propertyId,
        )
      : null;

    if (input.propertyId && !existing) {
      throw new NotFoundError("Listing not found");
    }

    const isLive = existing?.status === "PUBLISHED";

    if (isLive && existing) {
      const before = listingFormValues(existing);
      const values = listingPayload(input);
      const changes = diffFields(before, values, LISTING_LABELS);
      if (changes.length === 0) {
        throw new AppError("Nothing has changed yet", { status: 400 });
      }

      const submission = await submissionService.open({
        organizationId: context.organizationId,
        entityType: "PROPERTY",
        entityId: existing.id,
        kind: "UPDATE",
        title: `${input.name} — listing update`,
        payload: values as Prisma.InputJsonValue,
        changes: changes as unknown as Prisma.InputJsonValue,
        note: input.note,
        submittedById: context.userId,
        actorName: context.agent.name,
      });

      return {
        propertyId: existing.id,
        submissionId: submission.id,
        mode: "update-pending" as const,
      };
    }

    const property = await propertyService.upsertFromPortal(
      listingPayload(input),
      {
        organizationId: context.organizationId,
        agentId: context.agent.id,
        propertyId: existing?.id ?? null,
        status: "DRAFT",
        workflowState: options.submit ? "IN_REVIEW" : "DRAFT",
      },
    );

    if (!options.submit) {
      // Pulling a submitted listing back to draft must also clear it from the
      // reviewer's queue, or they would approve a version nobody is waiting on.
      const queued = await submissionRepository.findPending("PROPERTY", property.id);
      if (queued) await submissionRepository.withdraw(queued.id);
      return { propertyId: property.id, submissionId: null, mode: "draft" as const };
    }

    const submission = await submissionService.open({
      organizationId: context.organizationId,
      entityType: "PROPERTY",
      entityId: property.id,
      kind: "CREATE",
      title: `${input.name} — new listing`,
      payload: listingPayload(input) as Prisma.InputJsonValue,
      note: input.note,
      submittedById: context.userId,
      actorName: context.agent.name,
    });

    return {
      propertyId: property.id,
      submissionId: submission.id,
      mode: "create-pending" as const,
    };
  },

  // ------------------------------------------------------------------ posts

  async listPosts() {
    const context = await requirePortalPageContext();
    const posts = await prisma.blogPost.findMany({
      where: { authorId: context.userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        workflowState: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    const pending = await submissionRepository.pendingByEntityIds(
      "BLOG_POST",
      posts.map((post) => post.id),
    );
    return { context, posts, pending };
  },

  async getPost(postId: string) {
    const context = await requirePortalPageContext();
    const post = await prisma.blogPost.findFirst({
      where: { id: postId, authorId: context.userId, deletedAt: null },
    });
    if (!post) throw new NotFoundError("Post not found");

    const pending = await submissionRepository.findPending("BLOG_POST", post.id);
    const { coverUrl, body } = splitBlogCover(post.content);
    const stored = {
      postId: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: body,
      coverUrl,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
    };
    const pendingPayload = (pending?.payload as Record<string, unknown> | null) ?? null;

    return {
      context,
      post,
      live: post.workflowState === "PUBLISHED",
      pending,
      pendingChanges: (pending?.changes as unknown[] | null) ?? [],
      values: pendingPayload ? { ...stored, ...pendingPayload } : stored,
    };
  },

  async savePost(raw: unknown, options: { submit: boolean }) {
    const context = await requirePortalContext();
    await requirePermission("portal:blog");

    const input = portalPostSchema.parse(raw);
    const existing = input.postId
      ? await prisma.blogPost.findFirst({
          where: { id: input.postId, authorId: context.userId, deletedAt: null },
        })
      : null;

    if (input.postId && !existing) throw new NotFoundError("Post not found");

    if (existing?.workflowState === "PUBLISHED") {
      const { coverUrl, body } = splitBlogCover(existing.content);
      const before = {
        title: existing.title,
        excerpt: existing.excerpt,
        content: body,
        coverUrl,
        metaTitle: existing.metaTitle,
        metaDescription: existing.metaDescription,
      };
      const values = postPayload(input);
      const changes = diffFields(before, values, POST_LABELS);
      if (changes.length === 0) {
        throw new AppError("Nothing has changed yet", { status: 400 });
      }

      const submission = await submissionService.open({
        organizationId: context.organizationId,
        entityType: "BLOG_POST",
        entityId: existing.id,
        kind: "UPDATE",
        title: `${input.title} — post update`,
        payload: values as Prisma.InputJsonValue,
        changes: changes as unknown as Prisma.InputJsonValue,
        note: input.note,
        submittedById: context.userId,
        actorName: context.agent.name,
      });

      return {
        postId: existing.id,
        submissionId: submission.id,
        mode: "update-pending" as const,
      };
    }

    const content = embedBlogCover(input.content, input.coverUrl);
    const workflowState = options.submit ? "IN_REVIEW" : "DRAFT";

    const post = existing
      ? await prisma.blogPost.update({
          where: { id: existing.id },
          data: {
            title: input.title,
            excerpt: input.excerpt,
            content,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            workflowState,
          },
        })
      : await prisma.blogPost.create({
          data: {
            organizationId: context.organizationId,
            title: input.title,
            slug: await uniquePostSlug(context.organizationId, slugify(input.title)),
            excerpt: input.excerpt,
            content,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            authorId: context.userId,
            workflowState,
            source: "portal",
          },
        });

    if (!options.submit) {
      const queued = await submissionRepository.findPending("BLOG_POST", post.id);
      if (queued) await submissionRepository.withdraw(queued.id);
      return { postId: post.id, submissionId: null, mode: "draft" as const };
    }

    const submission = await submissionService.open({
      organizationId: context.organizationId,
      entityType: "BLOG_POST",
      entityId: post.id,
      kind: "CREATE",
      title: `${input.title} — new post`,
      payload: postPayload(input) as Prisma.InputJsonValue,
      note: input.note,
      submittedById: context.userId,
      actorName: context.agent.name,
    });

    return {
      postId: post.id,
      submissionId: submission.id,
      mode: "create-pending" as const,
    };
  },

  // ------------------------------------------------------------ submissions

  async mySubmissions() {
    const context = await requirePortalPageContext();
    const items = await submissionRepository.listForSubmitter(context.userId, 100);
    return { context, items };
  },

  async withdraw(submissionId: string) {
    const context = await requirePortalContext();
    const submission = await submissionRepository.findById(submissionId);
    if (!submission || submission.submittedById !== context.userId) {
      throw new NotFoundError("Submission not found");
    }
    if (submission.status !== "PENDING") {
      throw new AppError("Only pending submissions can be withdrawn", {
        status: 409,
      });
    }
    await submissionRepository.withdraw(submissionId);

    if (submission.kind === "CREATE" && submission.entityId) {
      if (submission.entityType === "PROPERTY") {
        await propertyRepository.setPortalWorkflow(
          context.organizationId,
          submission.entityId,
          { workflowState: "DRAFT", status: "DRAFT" },
        );
      }
      if (submission.entityType === "BLOG_POST") {
        await prisma.blogPost.update({
          where: { id: submission.entityId },
          data: { workflowState: "DRAFT" },
        });
      }
    }

    return { ok: true as const };
  },
};

function postPayload(input: PortalPostInput) {
  const values: Record<string, unknown> = { ...input };
  delete values.note;
  delete values.postId;
  return values;
}

async function uniquePostSlug(organizationId: string, base: string) {
  let slug = base || "post";
  let attempt = 1;
  while (
    await prisma.blogPost.findFirst({
      where: { organizationId, slug },
      select: { id: true },
    })
  ) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}
