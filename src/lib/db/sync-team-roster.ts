import type { PrismaClient } from "@prisma/client";

import { TEAM_ROSTER, type TeamRosterEntry } from "@/config/team-roster";

export type RosterSyncOutcome = {
  name: string;
  slug: string;
  action: "created" | "renamed" | "updated" | "restored";
  /** Set when a stale duplicate for the same person still exists. */
  duplicateSlug?: string;
};

/**
 * Upserts the canonical roster. Rows are matched on the current slug first and
 * on `previousSlugs` second, so correcting a name renames the existing profile
 * instead of leaving a duplicate behind with the old listings attached.
 *
 * Soft-deleted rows keep the unique slug, so they are matched and restored
 * rather than triggering a unique constraint error.
 */
export async function syncTeamRoster(
  client: PrismaClient,
  organizationId: string,
): Promise<RosterSyncOutcome[]> {
  const outcomes: RosterSyncOutcome[] = [];

  for (const [index, entry] of TEAM_ROSTER.entries()) {
    outcomes.push(await syncEntry(client, organizationId, entry, index));
  }

  return outcomes;
}

async function syncEntry(
  client: PrismaClient,
  organizationId: string,
  entry: TeamRosterEntry,
  sortOrder: number,
): Promise<RosterSyncOutcome> {
  const slugs = [entry.slug, ...(entry.previousSlugs ?? [])];
  const matches = await client.agent.findMany({
    where: { organizationId, slug: { in: slugs } },
    select: { id: true, slug: true, deletedAt: true },
  });

  const current = matches.find((row) => row.slug === entry.slug);
  const previous = matches.find((row) => row.slug !== entry.slug);
  const target = current ?? previous;

  const shared = {
    name: entry.name,
    slug: entry.slug,
    title: entry.title,
    sortOrder,
    isActive: true,
    ...(entry.isFeatured ? { isFeatured: true } : {}),
  };

  if (!target) {
    await client.agent.create({
      data: { organizationId, ...shared, isFeatured: entry.isFeatured ?? false },
    });
    return { name: entry.name, slug: entry.slug, action: "created" };
  }

  await client.agent.update({
    where: { id: target.id },
    data: { ...shared, deletedAt: null },
  });

  const action: RosterSyncOutcome["action"] = !current
    ? "renamed"
    : target.deletedAt
      ? "restored"
      : "updated";

  return {
    name: entry.name,
    slug: entry.slug,
    action,
    // Both slugs exist, so the old profile needs a manual merge or delete.
    ...(current && previous ? { duplicateSlug: previous.slug } : {}),
  };
}
