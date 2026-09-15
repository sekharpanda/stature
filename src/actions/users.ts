"use server";

import { revalidatePath } from "next/cache";

import { AppError } from "@/lib/errors";
import { userService } from "@/services/user.service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) return { ok: false, error: error.message };
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Unexpected error" };
}

export async function inviteUserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await userService.invite(input);
    revalidatePath("/admin/users");
    return { ok: true, data: { id: user.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resendInviteAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await userService.resendInvite(input);
    revalidatePath("/admin/users");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateUserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await userService.update(input);
    revalidatePath("/admin/users");
    return { ok: true, data: { id: user?.id ?? "" } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteUserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const result = await userService.delete(input);
    revalidatePath("/admin/users");
    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateUserStatusAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await userService.updateStatus(input);
    revalidatePath("/admin/users");
    return { ok: true, data: { id: user.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setUserRolesAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await userService.setRoles(input);
    revalidatePath("/admin/users");
    return { ok: true, data: { id: user?.id ?? "" } };
  } catch (error) {
    return toActionError(error);
  }
}
