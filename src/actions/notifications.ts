"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { notificationRepository } from "@/repositories/notification.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function markNotificationReadAction(
  id: string,
): Promise<ActionResult<null>> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  await notificationRepository.markRead(id);
  revalidatePath("/admin", "layout");
  return { ok: true, data: null };
}

export async function markAllNotificationsReadAction(): Promise<
  ActionResult<null>
> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const org = await organizationRepository.getDefault();
  if (!org) return { ok: false, error: "Organization not found" };

  await notificationRepository.markAllRead(org.id);
  revalidatePath("/admin", "layout");
  return { ok: true, data: null };
}
