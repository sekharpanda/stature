"use server";

import { revalidatePath } from "next/cache";

import { AppError } from "@/lib/errors";
import { contentImportService } from "@/services/content-import.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return { ok: false, error: error.message, details: error.details };
  }
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Unexpected error" };
}

export async function importContentJsonAction(
  input: unknown,
): Promise<
  ActionResult<Awaited<ReturnType<typeof contentImportService.importJson>>>
> {
  try {
    const data = await contentImportService.importJson(input);
    revalidatePath("/admin/blog");
    revalidatePath("/admin/agents");
    revalidatePath("/admin/developers");
    revalidatePath("/admin/areas");
    revalidatePath("/admin/faqs");
    revalidatePath("/admin/testimonials");
    revalidatePath("/blog");
    revalidatePath("/our-team");
    revalidatePath("/areas");
    revalidatePath("/developers");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
