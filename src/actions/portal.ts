"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import { getMediaStorage } from "@/providers/media";
import { portalService } from "@/services/portal.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

function toActionError<T = never>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) {
    return { ok: false, error: error.message, details: error.details };
  }
  if (error instanceof ZodError) {
    return {
      ok: false,
      error: error.issues[0]?.message ?? "Validation failed",
      details: error.flatten(),
    };
  }
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Unexpected error" };
}

function revalidatePortal() {
  revalidatePath("/admin/my");
  revalidatePath("/admin/my/submissions");
  revalidatePath("/admin/approvals");
}

export async function submitProfileChangesAction(
  input: unknown,
): Promise<ActionResult<{ submissionId: string }>> {
  try {
    const result = await portalService.submitProfile(input);
    revalidatePath("/admin/my/profile");
    revalidatePortal();
    return { ok: true, data: { submissionId: result.submissionId } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function savePortalListingAction(
  input: unknown,
  options?: { submit?: boolean },
): Promise<
  ActionResult<{
    propertyId: string;
    submissionId: string | null;
    mode: string;
  }>
> {
  try {
    const result = await portalService.saveListing(input, {
      submit: options?.submit === true,
    });
    revalidatePath("/admin/my/listings");
    revalidatePath(`/admin/my/listings/${result.propertyId}`);
    revalidatePortal();
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function savePortalPostAction(
  input: unknown,
  options?: { submit?: boolean },
): Promise<
  ActionResult<{ postId: string; submissionId: string | null; mode: string }>
> {
  try {
    const result = await portalService.savePost(input, {
      submit: options?.submit === true,
    });
    revalidatePath("/admin/my/posts");
    revalidatePath(`/admin/my/posts/${result.postId}`);
    revalidatePortal();
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function withdrawSubmissionAction(
  submissionId: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const result = await portalService.withdraw(submissionId);
    revalidatePath("/admin/my/listings");
    revalidatePath("/admin/my/posts");
    revalidatePortal();
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

/** Photo and listing image uploads from the portal. */
export async function uploadPortalMediaAction(
  formData: FormData,
): Promise<ActionResult<{ urls: string[] }>> {
  try {
    await requirePermission("media:upload");
    const org = await organizationRepository.getDefault();
    if (!org) return { ok: false, error: "Organization not found" };

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => typeof File !== "undefined" && entry instanceof File);

    if (files.length === 0) return { ok: false, error: "No files selected" };
    if (files.length > 12) return { ok: false, error: "Upload up to 12 files at once" };

    const folder = String(formData.get("folder") ?? "portal");
    const urls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return { ok: false, error: `Not an image: ${file.name}` };
      }
      if (file.size > 8 * 1024 * 1024) {
        return { ok: false, error: `${file.name} exceeds 8MB` };
      }
      const uploaded = await getMediaStorage().upload({
        organizationId: org.id,
        filename: file.name,
        mimeType: file.type,
        body: Buffer.from(await file.arrayBuffer()),
        folder: folder === "agents" ? "agents" : "properties",
      });
      urls.push(uploaded.url);
    }

    return { ok: true, data: { urls } };
  } catch (error) {
    return toActionError<{ urls: string[] }>(error);
  }
}
