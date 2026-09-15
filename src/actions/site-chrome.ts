"use server";

import { revalidatePath } from "next/cache";

import type { SiteChrome } from "@/config/site-chrome-defaults";
import { AppError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getSession, getUserPermissionKeys } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import { siteChromeService } from "@/services/site-chrome.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireChromePermission() {
  const session = await getSession();
  if (!session?.user?.id) throw new UnauthorizedError();
  const keys = await getUserPermissionKeys(session.user.id);
  if (!keys.includes("cms:menu") && !keys.includes("cms:page")) {
    throw new ForbiddenError("Missing permission to edit menus");
  }
}

export async function updateSiteChromeAction(input: {
  organizationId?: string;
  chrome: SiteChrome;
}): Promise<ActionResult<{ saved: true }>> {
  try {
    await requireChromePermission();
    const orgId =
      input.organizationId ?? (await organizationRepository.getDefault())?.id;
    if (!orgId) throw new AppError("Organization not found", { status: 404 });
    await siteChromeService.save(orgId, input.chrome);
    revalidatePath("/", "layout");
    revalidatePath("/admin/menus");
    revalidatePath("/contact");
    return { ok: true, data: { saved: true } };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: "Unexpected error" };
  }
}
