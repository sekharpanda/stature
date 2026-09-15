/**
 * Backfill PropertyType links from Off Plan sync payloads
 * (unitSummary.bedroomGroups[].unitType).
 *
 * Usage: npx tsx scripts/backfill-property-types.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/utils";
import { inferPropertyTypeFromOffPlan } from "../src/providers/leadrat/offplan-mappers";
import type {
  OffPlanListingCard,
  OffPlanProjectDetail,
} from "../src/providers/leadrat/offplan-client";

const prisma = new PrismaClient();

async function upsertType(organizationId: string, name: string) {
  const slug = slugify(name);
  const existing = await prisma.propertyType.findFirst({
    where: { organizationId, slug, deletedAt: null },
  });
  if (existing) return existing.id;
  const created = await prisma.propertyType.create({
    data: { organizationId, name, slug },
  });
  return created.id;
}

function asListing(
  payload: unknown,
): OffPlanListingCard | OffPlanProjectDetail | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  if (raw.project && typeof raw.project === "object") {
    return raw.project as OffPlanProjectDetail;
  }
  return payload as OffPlanListingCard | OffPlanProjectDetail;
}

async function main() {
  const rows = await prisma.property.findMany({
    where: {
      deletedAt: null,
      source: "LEADRAT",
      propertyTypeId: null,
    },
    select: {
      id: true,
      organizationId: true,
      sync: { select: { lastPayload: true } },
    },
  });

  let updated = 0;
  let skipped = 0;
  const typeCounts = new Map<string, number>();

  for (const row of rows) {
    const listing = asListing(row.sync?.lastPayload);
    const typeName = listing ? inferPropertyTypeFromOffPlan(listing) : null;
    if (!typeName) {
      skipped += 1;
      continue;
    }
    const typeId = await upsertType(row.organizationId, typeName);
    await prisma.property.update({
      where: { id: row.id },
      data: { propertyTypeId: typeId },
    });
    updated += 1;
    typeCounts.set(typeName, (typeCounts.get(typeName) ?? 0) + 1);
  }

  console.log(
    JSON.stringify(
      {
        scanned: rows.length,
        updated,
        skipped,
        types: Object.fromEntries(typeCounts),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
