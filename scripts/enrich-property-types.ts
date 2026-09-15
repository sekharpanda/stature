/**
 * Enrich missing PropertyType links by fetching Off Plan listing details.
 *
 * Usage: npx tsx scripts/enrich-property-types.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Prisma, PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/utils";
import { inferPropertyTypeFromOffPlan } from "../src/providers/leadrat/offplan-mappers";
import { offPlanClient } from "../src/providers/leadrat/offplan-client";

const prisma = new PrismaClient();
const CONCURRENCY = 3;

async function upsertType(organizationId: string, name: string) {
  const slug = slugify(name);
  const existing = await prisma.propertyType.findFirst({
    where: { organizationId, slug, deletedAt: null },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.propertyType.create({
      data: { organizationId, name, slug },
    });
    return created.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const again = await prisma.propertyType.findFirst({
        where: { organizationId, slug, deletedAt: null },
      });
      if (again) return again.id;
    }
    throw error;
  }
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index++;
      await worker(items[current]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );
}

async function main() {
  const rows = await prisma.property.findMany({
    where: {
      deletedAt: null,
      source: "LEADRAT",
      status: "PUBLISHED",
      propertyTypeId: null,
      leadratProjectId: { not: null },
    },
    select: {
      id: true,
      organizationId: true,
      leadratProjectId: true,
    },
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const typeCounts = new Map<string, number>();
  const sampleErrors: string[] = [];

  await mapPool(rows, CONCURRENCY, async (row) => {
    try {
      const detail = await offPlanClient.getListing(row.leadratProjectId!);
      const listing = detail.project;
      const typeName = inferPropertyTypeFromOffPlan(listing);
      if (!typeName) {
        skipped += 1;
        return;
      }
      const typeId = await upsertType(row.organizationId, typeName);
      await prisma.property.update({
        where: { id: row.id },
        data: { propertyTypeId: typeId },
      });
      updated += 1;
      typeCounts.set(typeName, (typeCounts.get(typeName) ?? 0) + 1);
    } catch (error) {
      failed += 1;
      if (sampleErrors.length < 5) {
        sampleErrors.push(
          `${row.leadratProjectId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        scanned: rows.length,
        updated,
        skipped,
        failed,
        types: Object.fromEntries(typeCounts),
        sampleErrors,
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
