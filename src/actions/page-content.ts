"use server";

import { revalidatePath } from "next/cache";

import {
  STATIC_PAGE_META,
  type StaticPageContent,
  type StaticPageKey,
  STATIC_PAGE_KEYS,
} from "@/config/page-content-defaults";
import type { PermissionKey } from "@/constants/permissions";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getSession, getUserPermissionKeys } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import { pageContentService } from "@/services/page-content.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const PERMS: PermissionKey[] = ["cms:page", "cms:homepage", "cms:blog"];

async function requirePageEditPermission() {
  const session = await getSession();
  if (!session?.user?.id) throw new UnauthorizedError();
  const keys = await getUserPermissionKeys(session.user.id);
  if (!PERMS.some((p) => keys.includes(p))) {
    throw new ForbiddenError("Missing permission to edit page content");
  }
}

function isStaticPageKey(value: string): value is StaticPageKey {
  return (STATIC_PAGE_KEYS as readonly string[]).includes(value);
}

export async function updatePageContentAction(input: {
  organizationId?: string;
  key: StaticPageKey;
  content: StaticPageContent;
}): Promise<ActionResult<{ saved: true }>> {
  try {
    await requirePageEditPermission();
    if (!isStaticPageKey(input.key)) {
      throw new AppError("Unknown page key", { status: 400 });
    }
    const orgId =
      input.organizationId ??
      (await organizationRepository.getDefault())?.id;
    if (!orgId) {
      throw new AppError("Organization not found", { status: 404 });
    }
    await pageContentService.save(orgId, input.key, input.content);
    const meta = STATIC_PAGE_META[input.key];
    revalidatePath(meta.href);
    if (input.key === "about") revalidatePath("/about-us");
    if (input.key === "market-insights") revalidatePath("/insights");
    if (input.key === "blog") revalidatePath("/blogs");
    revalidatePath("/admin/pages");
    revalidatePath("/admin/homepage");
    return { ok: true, data: { saved: true } };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: "Unexpected error" };
  }
}
