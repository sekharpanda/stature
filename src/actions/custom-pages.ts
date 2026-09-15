"use server";

import { revalidatePath } from "next/cache";

import type { StaticPageContent } from "@/config/page-content-defaults";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getSession, getUserPermissionKeys } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import { customPageService } from "@/services/custom-page.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requirePagePermission() {
  const session = await getSession();
  if (!session?.user?.id) throw new UnauthorizedError();
  const keys = await getUserPermissionKeys(session.user.id);
  if (!keys.includes("cms:page")) {
    throw new ForbiddenError("Missing permission to manage pages");
  }
}

export async function createCustomPageAction(input: {
  organizationId?: string;
  title: string;
  slug: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  content: StaticPageContent;
  publish?: boolean;
}): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await requirePagePermission();
    const orgId =
      input.organizationId ?? (await organizationRepository.getDefault())?.id;
    if (!orgId) throw new AppError("Organization not found", { status: 404 });
    const page = await customPageService.create(orgId, input);
    revalidatePath("/admin/pages");
    revalidatePath(`/${page.slug}`);
    revalidatePath("/sitemap.xml");
    return { ok: true, data: { id: page.id, slug: page.slug } };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: "Unexpected error" };
  }
}

export async function updateCustomPageAction(input: {
  organizationId?: string;
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  content: StaticPageContent;
  publish?: boolean;
}): Promise<ActionResult<{ slug: string }>> {
  try {
    await requirePagePermission();
    const orgId =
      input.organizationId ?? (await organizationRepository.getDefault())?.id;
    if (!orgId) throw new AppError("Organization not found", { status: 404 });
    const page = await customPageService.update(orgId, input.id, {
      ...input,
      workflowState: input.publish ? "PUBLISHED" : "DRAFT",
    });
    revalidatePath("/admin/pages");
    revalidatePath(`/admin/pages/${page.id}`);
    revalidatePath(`/${page.slug}`);
    revalidatePath("/sitemap.xml");
    return { ok: true, data: { slug: page.slug } };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: "Unexpected error" };
  }
}

export async function deleteCustomPageAction(input: {
  organizationId?: string;
  id: string;
}): Promise<ActionResult<{ deleted: true }>> {
  try {
    await requirePagePermission();
    const orgId =
      input.organizationId ?? (await organizationRepository.getDefault())?.id;
    if (!orgId) throw new AppError("Organization not found", { status: 404 });
    await customPageService.remove(orgId, input.id);
    revalidatePath("/admin/pages");
    revalidatePath("/sitemap.xml");
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: "Unexpected error" };
  }
}
