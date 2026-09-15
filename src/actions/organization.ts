"use server";

import { revalidatePath } from "next/cache";

import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/auth";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  updateOrganizationSchema,
  updateSeoSettingsSchema,
} from "@/schemas/catalog.schema";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

function toActionError<T = never>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) {
    return { ok: false, error: error.message, details: error.details };
  }
  if (error instanceof Error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Unexpected error" };
}

export async function updateOrganizationAction(
  organizationId: string,
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    await requirePermission("settings:manage");
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new AppError("Organization not found", { status: 404 });

    const parsed = updateOrganizationSchema.parse(input);
    const updated = await organizationRepository.update(org.id, parsed);

    revalidatePath("/admin/settings");
    revalidatePath("/admin/seo");
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    revalidatePath("/contact");
    return { ok: true, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateSeoSettingsAction(
  input: unknown,
): Promise<ActionResult<{ saved: number }>> {
  try {
    await requirePermission("cms:seo");
    const parsed = updateSeoSettingsSchema.parse(input);

    const org = await organizationRepository.findById(parsed.organizationId);
    if (!org) throw new AppError("Organization not found", { status: 404 });

    if (parsed.organization) {
      await organizationRepository.update(org.id, {
        name: parsed.organization.name,
        domain: parsed.organization.domain || null,
        primaryColor: parsed.organization.primaryColor || null,
        defaultCurrency: parsed.organization.defaultCurrency,
      });
    }

    await organizationRepository.upsertWebsiteSettings(
      org.id,
      parsed.settings,
    );

    revalidatePath("/admin/seo");
    revalidatePath("/admin", "layout");
    return { ok: true, data: { saved: parsed.settings.length } };
  } catch (error) {
    return toActionError(error);
  }
}
