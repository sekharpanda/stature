"use server";

import { revalidatePath } from "next/cache";

import type { HomepageContent } from "@/config/homepage-defaults";
import type { PermissionKey } from "@/constants/permissions";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getSession, getUserPermissionKeys } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import { homepageService } from "@/services/homepage.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) return { ok: false, error: error.message };
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Unexpected error" };
}

const HOMEPAGE_PERMS: PermissionKey[] = [
  "cms:homepage",
  "cms:page",
  "developer:manage",
];

async function requireHomepageEditPermission() {
  const session = await getSession();
  if (!session?.user?.id) throw new UnauthorizedError();
  const keys = await getUserPermissionKeys(session.user.id);
  if (!HOMEPAGE_PERMS.some((p) => keys.includes(p))) {
    throw new ForbiddenError(
      "Missing permission: cms:homepage (or cms:page / developer:manage)",
    );
  }
  return session;
}

export async function updateHomepageContentAction(input: {
  organizationId?: string;
  content: HomepageContent;
}): Promise<ActionResult<{ saved: true }>> {
  try {
    await requireHomepageEditPermission();

    const orgId =
      input.organizationId ??
      (await organizationRepository.getDefault())?.id;
    if (!orgId) {
      throw new AppError("Organization not found", { status: 404 });
    }

    await homepageService.saveContent(orgId, input.content);
    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}
