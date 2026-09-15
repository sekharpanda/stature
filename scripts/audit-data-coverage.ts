/**
 * Read-only coverage report used to decide which public card fields can be
 * shown reliably. Run with: npx tsx scripts/audit-data-coverage.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const published = { status: "PUBLISHED" as const, deletedAt: null };
  const listable = { ...published, images: { some: { deletedAt: null } } };

  const [total, listableCount, listableWithGeo, listableWithPrice] =
    await Promise.all([
      prisma.property.count({ where: published }),
      prisma.property.count({ where: listable }),
      prisma.property.count({
        where: { ...listable, address: { latitude: { not: null } } },
      }),
      prisma.property.count({
        where: { ...listable, minPrice: { not: null, gt: 0 } },
      }),
    ]);

  console.log(`published properties:        ${total}`);
  console.log(`listable (has image):        ${listableCount}`);
  console.log(`  of those, with lat/lng:    ${listableWithGeo}`);
  console.log(`  of those, with a price:    ${listableWithPrice}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
