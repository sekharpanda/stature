/**
 * Recompute Property.listPriority from the preferred developers / projects sheet.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

import {
  computeListPriority,
  DEFAULT_LIST_PRIORITY,
} from "../src/config/priority-developers";

const prisma = new PrismaClient();

async function main() {
  const batchSize = 200;
  let skip = 0;
  let updated = 0;
  let prioritized = 0;

  for (;;) {
    const rows = await prisma.property.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        listPriority: true,
        developer: { select: { name: true, listPriority: true } },
      },
      orderBy: { id: "asc" },
      skip,
      take: batchSize,
    });
    if (!rows.length) break;

    for (const row of rows) {
          const next = computeListPriority(
            row.name,
            row.developer?.name,
            row.developer?.listPriority,
          );
      if (next !== row.listPriority) {
        await prisma.property.update({
          where: { id: row.id },
          data: { listPriority: next },
        });
        updated += 1;
      }
      if (next < DEFAULT_LIST_PRIORITY) prioritized += 1;
    }

    skip += rows.length;
    console.log(`Scanned ${skip}…`);
  }

  console.log(
    JSON.stringify(
      {
        scanned: skip,
        updated,
        prioritized,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
