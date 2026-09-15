"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { organizationRepository } from "@/repositories/organization.repository";
import { portalAccessRequestSchema } from "@/schemas/portal.schema";
import { submissionService } from "@/services/submission.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError<T = never>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) return { ok: false, error: error.message };
  if (error instanceof ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Validation failed" };
  }
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Unexpected error" };
}

/**
 * Self-registration for consultants. The account is created but carries no
 * role, so it can reach nothing until a superadmin approves the request.
 */
export async function requestPortalAccessAction(
  input: unknown,
): Promise<ActionResult<{ pending: true }>> {
  try {
    const parsed = portalAccessRequestSchema.parse(input);
    const org = await organizationRepository.getDefault();
    if (!org) throw new AppError("Organization not found", { status: 500 });

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(
        "An account already exists for that email. Sign in instead, or ask an administrator for help.",
        { status: 409 },
      );
    }

    const signUp = await auth.api.signUpEmail({
      body: {
        name: parsed.name,
        email: parsed.email,
        password: parsed.password,
      },
    });

    const userId = signUp.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: org.id,
        phone: parsed.phone,
        status: "INVITED",
      },
    });

    await submissionService.open({
      organizationId: org.id,
      entityType: "AGENT_ACCOUNT",
      kind: "ACCESS_REQUEST",
      title: `${parsed.name} — portal access request`,
      payload: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        reraNumber: parsed.reraNumber,
      },
      note: parsed.note,
      submittedById: userId,
      actorName: parsed.name,
    });

    revalidatePath("/admin/approvals");
    return { ok: true, data: { pending: true } };
  } catch (error) {
    return toActionError(error);
  }
}
