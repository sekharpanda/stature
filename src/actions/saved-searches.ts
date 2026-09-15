"use server";

import { z } from "zod";

import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export type SavedSearchResult =
  | { ok: true }
  | { ok: false; error: string };

const saveSearchSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().max(180).optional(),
  query: z.record(z.string(), z.string()).default({}),
  // Bots fill hidden fields; humans leave them empty.
  website: z.string().max(0).optional(),
});

export async function saveSearchAction(
  input: unknown,
): Promise<SavedSearchResult> {
  const parsed = saveSearchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the details and retry",
    };
  }

  if (parsed.data.website) return { ok: true };

  try {
    const org = await organizationRepository.getDefault();
    if (!org) return { ok: false, error: "Unable to save right now" };

    const { email, name, query } = parsed.data;

    await prisma.savedSearch.create({
      data: {
        organizationId: org.id,
        // Anonymous visitors are keyed by email until accounts exist.
        sessionKey: email.toLowerCase(),
        name: name?.trim() || null,
        query: { ...query, email: email.toLowerCase() },
        notifyEmail: true,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to save right now. Please try again." };
  }
}
