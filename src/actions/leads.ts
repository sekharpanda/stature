"use server";

import { AppError } from "@/lib/errors";
import { leadService } from "@/services/lead.service";
import { createLeadSchema } from "@/schemas/lead.schema";
import { headers } from "next/headers";

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

export async function captureLeadAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const h = await headers();
    const lead = await leadService.capture(createLeadSchema.parse(input), {
      ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent"),
    });
    return { ok: true, data: { id: lead.id } };
  } catch (error) {
    return toActionError<{ id: string }>(error);
  }
}

export async function retryLeadCrmSyncAction(
  leadId: string,
): Promise<ActionResult<unknown>> {
  try {
    const result = await leadService.retryCrmSync(leadId);
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateLeadStatusAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await leadService.updateStatus(input);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function assignLeadAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await leadService.assign(input);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addLeadNoteAction(
  input: unknown,
): Promise<ActionResult<unknown>> {
  try {
    const data = await leadService.addNote(input);
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
