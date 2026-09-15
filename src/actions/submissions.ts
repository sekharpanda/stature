"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors";
import { submissionService } from "@/services/submission.service";

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

export async function reviewSubmissionAction(
  input: unknown,
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const decided = await submissionService.decide(input);

    revalidatePath("/admin/approvals");
    revalidatePath(`/admin/approvals/${decided.id}`);
    revalidatePath("/admin/my/submissions");

    switch (decided.entityType) {
      case "PROPERTY":
        revalidatePath("/admin/properties");
        revalidatePath("/properties");
        revalidatePath("/admin/my/listings");
        if (decided.entityId) {
          revalidatePath(`/admin/properties/${decided.entityId}`);
          revalidatePath(`/admin/my/listings/${decided.entityId}`);
        }
        revalidatePath("/properties/[slug]", "page");
        break;
      case "BLOG_POST":
        revalidatePath("/admin/blog");
        revalidatePath("/blog");
        revalidatePath("/admin/my/posts");
        revalidatePath("/blog/[slug]", "page");
        break;
      case "AGENT_PROFILE":
        revalidatePath("/admin/agents");
        revalidatePath("/our-team");
        revalidatePath("/our-team/[slug]", "page");
        revalidatePath("/admin/my/profile");
        break;
      case "AGENT_ACCOUNT":
        revalidatePath("/admin/users");
        revalidatePath("/admin/agents");
        break;
      default:
        break;
    }

    return { ok: true, data: { id: decided.id, status: decided.status } };
  } catch (error) {
    return toActionError(error);
  }
}
