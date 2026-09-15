"use server";

import { revalidatePath } from "next/cache";

import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import {
  blogSyncService,
  type BlogSyncOverrides,
} from "@/services/blog-sync.service";

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

export async function runBlogApiSyncAction(
  input?: BlogSyncOverrides,
): Promise<ActionResult<Awaited<ReturnType<typeof blogSyncService.syncAll>>>> {
  try {
    const data = await blogSyncService.syncAll(input);
    revalidatePath("/admin/blog");
    revalidatePath("/admin/api-fetch");
    revalidatePath("/blog");
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getBlogSyncOverviewAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof blogSyncService.getOverview>>>
> {
  try {
    const data = await blogSyncService.getOverview();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
