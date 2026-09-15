/**
 * Reconcile the RBAC catalog in the database with src/constants/permissions.ts.
 * Usage: npx tsx scripts/sync-permissions.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { syncPermissionsAndRoles } from "../src/lib/db/sync-permissions";

const prisma = new PrismaClient();

async function main() {
  const org =
    (await prisma.organization.findFirst({
      where: { slug: process.env.SEED_ORG_SLUG ?? "prowin", deletedAt: null },
    })) ?? (await prisma.organization.findFirst({ where: { deletedAt: null } }));

  if (!org) throw new Error("No organization found. Run npm run db:seed first.");

  const outcomes = await syncPermissionsAndRoles(prisma, org.id);

  for (const outcome of outcomes) {
    const parts = [
      outcome.granted.length ? `+${outcome.granted.join(" +")}` : null,
      outcome.revoked.length ? `-${outcome.revoked.join(" -")}` : null,
    ].filter(Boolean);
    console.log(`${outcome.slug.padEnd(18)} ${parts.length ? parts.join(" ") : "unchanged"}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
