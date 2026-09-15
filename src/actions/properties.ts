"use server";

import { revalidatePath } from "next/cache";

import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { propertyService } from "@/services/property.service";
import { propertySyncService } from "@/services/property-sync.service";

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
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Unexpected error" };
}

export async function runLeadRatPropertySyncAction(input?: {
  maxPages?: number;
  markMissing?: boolean;
}): Promise<ActionResult<Awaited<ReturnType<typeof propertySyncService.syncAll>>>> {
  try {
    const data = await propertySyncService.syncAll({
      maxPages: input?.maxPages,
      markMissing: input?.markMissing,
    });
    revalidatePath("/admin/properties");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function syncLeadRatProjectAction(
  leadratProjectId: string,
): Promise<ActionResult<unknown>> {
  try {
    const data = await propertySyncService.syncOne(leadratProjectId);
    revalidatePath("/admin/properties");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getLeadRatSyncOverviewAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof propertySyncService.getOverview>>>
> {
  try {
    const data = await propertySyncService.getOverview();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPropertyPublishAction(input: {
  propertyId: string;
  published: boolean;
}): Promise<
  ActionResult<Awaited<ReturnType<typeof propertyService.setPublishStatus>>>
> {
  try {
    const data = await propertyService.setPublishStatus(
      input.propertyId,
      input.published,
    );
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${input.propertyId}`);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setPropertyMarketingOffersAction(
  input: unknown,
): Promise<
  ActionResult<Awaited<ReturnType<typeof propertyService.setMarketingOffers>>>
> {
  try {
    const data = await propertyService.setMarketingOffers(input);
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${data.id}`);
    revalidatePath("/properties");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createManualPropertyAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const property = await propertyService.createManual(input);
    revalidatePath("/admin/properties");
    return { ok: true, data: { id: property.id } };
  } catch (error) {
    return toActionError<{ id: string }>(error);
  }
}

export async function assignPropertyAgentAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await propertyService.assignAgent(input);
    const id =
      data && typeof data === "object" && "id" in data
        ? String((data as { id: string }).id)
        : null;
    revalidatePath("/admin/properties");
    if (id) revalidatePath(`/admin/properties/${id}`);
    revalidatePath("/admin/agents");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function uploadPropertyImagesAction(
  formData: FormData,
): Promise<ActionResult<{ urls: string[] }>> {
  try {
    const { requirePermission } = await import("@/lib/auth");
    const { organizationRepository } = await import(
      "@/repositories/organization.repository"
    );
    const { getMediaStorage } = await import("@/providers/media");

    await requirePermission("property:create");
    const org = await organizationRepository.getDefault();
    if (!org) {
      return { ok: false, error: "Organization not found" };
    }

    const files = formData.getAll("images").filter(
      (f): f is File => typeof File !== "undefined" && f instanceof File,
    );
    if (files.length === 0) {
      return { ok: false, error: "No images selected" };
    }
    if (files.length > 10) {
      return { ok: false, error: "Upload up to 10 photos" };
    }

    const urls: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return { ok: false, error: `Not an image: ${file.name}` };
      }
      if (file.size > 8 * 1024 * 1024) {
        return { ok: false, error: `${file.name} exceeds 8MB` };
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await getMediaStorage().upload({
        organizationId: org.id,
        filename: file.name,
        mimeType: file.type,
        body: buffer,
        folder: "properties",
      });
      urls.push(uploaded.url);
    }

    return { ok: true, data: { urls } };
  } catch (error) {
    return toActionError<{ urls: string[] }>(error);
  }
}

export async function importManualPropertiesJsonAction(
  input: unknown,
): Promise<
  ActionResult<Awaited<ReturnType<typeof propertyService.importManualJson>>>
> {
  try {
    const data = await propertyService.importManualJson(input);
    revalidatePath("/admin/properties");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
