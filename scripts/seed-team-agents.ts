/**
 * Sync the canonical consultant roster into Agent so Admin → Agents,
 * /our-team and the /our-team/[slug] profiles match.
 * Usage: npx tsx --env-file=.env.local scripts/seed-team-agents.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { syncTeamRoster } from "../src/lib/db/sync-team-roster";

const prisma = new PrismaClient();

async function main() {
  const org =
    (await prisma.organization.findFirst({
      where: { slug: process.env.SEED_ORG_SLUG ?? "prowin", deletedAt: null },
    })) ?? (await prisma.organization.findFirst({ where: { deletedAt: null } }));

  if (!org) {
    throw new Error("No organization found. Run npm run db:seed first.");
  }

  const outcomes = await syncTeamRoster(prisma, org.id);

  for (const outcome of outcomes) {
    console.log(
      `${outcome.action.padEnd(8)} ${outcome.name} (/our-team/${outcome.slug})` +
        (outcome.duplicateSlug
          ? ` — stale duplicate still present: ${outcome.duplicateSlug}`
          : ""),
    );
  }

  const live = await prisma.agent.count({
    where: { organizationId: org.id, deletedAt: null, isActive: true },
  });
  console.log(`\n${outcomes.length} roster profiles synced · ${live} live agents`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
