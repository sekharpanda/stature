"use server";

import { revalidatePath } from "next/cache";
import { ZodError, z } from "zod";

import { AppError } from "@/lib/errors";
import {
  API_SOURCE_TARGETS,
  apiSourceService,
  type ApiSourceInput,
} from "@/services/api-source.service";

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

const sourceSchema = z.object({
  name: z.string().min(2, "Name is required"),
  target: z.enum(API_SOURCE_TARGETS),
  method: z.string().optional(),
  url: z.string().url("Enter a valid API URL"),
  headers: z.record(z.string(), z.string()).optional(),
  authType: z.enum(["none", "bearer", "basic"]).optional(),
  authValue: z.string().nullable().optional(),
  itemsPath: z.string().nullable().optional(),
  fieldMap: z.record(z.string(), z.string()),
  autoPublish: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

function revalidateTargets(target?: string) {
  revalidatePath("/admin/api-fetch");
  const all = !target;
  if (all || target === "BLOG" || target === "INSIGHT") {
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    revalidatePath("/market-insights");
  }
  if (all || target === "FAQ") {
    revalidatePath("/admin/faqs");
    revalidatePath("/contact");
  }
  if (all || target === "TESTIMONIAL") {
    revalidatePath("/admin/testimonials");
    revalidatePath("/about");
  }
  if (all || target === "DEVELOPER") {
    revalidatePath("/admin/developers");
    revalidatePath("/developers");
  }
  if (all || target === "AREA") {
    revalidatePath("/admin/areas");
    revalidatePath("/areas");
  }
  if (all || target === "COMMUNITY") {
    revalidatePath("/admin/communities");
  }
  if (all || target === "AGENT") {
    revalidatePath("/admin/agents");
    revalidatePath("/our-team");
  }
  if (all || target === "AMENITY") {
    revalidatePath("/admin/amenities");
  }
  if (all || target === "PROPERTY") {
    revalidatePath("/admin/properties");
    revalidatePath("/properties");
  }
  if (all || target === "CATEGORY") {
    revalidatePath("/admin/categories");
  }
  if (all || target === "PAGE") {
    revalidatePath("/admin/pages");
  }
  if (all || target === "LANDING_PAGE") {
    revalidatePath("/admin/landing-pages");
  }
}

export async function createApiSourceAction(
  input: ApiSourceInput,
): Promise<ActionResult<Awaited<ReturnType<typeof apiSourceService.create>>>> {
  try {
    const data = sourceSchema.parse(input);
    const result = await apiSourceService.create(data);
    revalidateTargets(data.target);
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateApiSourceAction(input: {
  id: string;
  data: Partial<ApiSourceInput>;
}): Promise<ActionResult<Awaited<ReturnType<typeof apiSourceService.update>>>> {
  try {
    const result = await apiSourceService.update(input.id, input.data);
    revalidateTargets(input.data.target);
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteApiSourceAction(
  id: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const result = await apiSourceService.remove(id);
    revalidatePath("/admin/api-fetch");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function previewApiSourceAction(
  id: string,
): Promise<ActionResult<Awaited<ReturnType<typeof apiSourceService.preview>>>> {
  try {
    const data = await apiSourceService.preview(id);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function syncApiSourceAction(
  id: string,
): Promise<ActionResult<Awaited<ReturnType<typeof apiSourceService.sync>>>> {
  try {
    const data = await apiSourceService.sync(id);
    revalidateTargets();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
