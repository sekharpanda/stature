/**
 * Seed Developer.listPriority from the priority sheet, then sync property ranks.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

import {
  computeListPriority,
  DEFAULT_LIST_PRIORITY,
  PRIORITY_DEVELOPERS,
} from "../src/config/priority-developers";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!org) throw new Error("No organization found");

  const developers = await prisma.developer.findMany({
    where: { organizationId: org.id, deletedAt: null },
    select: { id: true, name: true, listPriority: true },
  });

  const assigned = new Set<string>();
  let seeded = 0;

  for (let i = 0; i < PRIORITY_DEVELOPERS.length; i++) {
    const entry = PRIORITY_DEVELOPERS[i]!;
    const match = developers.find((d) => {
      if (assigned.has(d.id)) return false;
      const name = d.name.toLowerCase();
      return entry.developerMatchers.some((m) => name.includes(m.toLowerCase()));
    });
    if (!match) continue;
    assigned.add(match.id);
    if (match.listPriority !== i) {
      await prisma.developer.update({
        where: { id: match.id },
        data: { listPriority: i },
      });
      seeded += 1;
    }
  }

  // Unpin developers that aren't in the sheet (keep existing UI pins below sheet ranks)
  // Only reset those that were never set? Skip — only seed matches.

  let propUpdated = 0;
  const batchSize = 200;
  let skip = 0;
  for (;;) {
    const rows = await prisma.property.findMany({
      where: { organizationId: org.id, deletedAt: null },
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
        propUpdated += 1;
      }
    }
    skip += rows.length;
  }

  const pinned = await prisma.developer.count({
    where: {
      organizationId: org.id,
      deletedAt: null,
      listPriority: { lt: DEFAULT_LIST_PRIORITY },
    },
  });

  console.log(
    JSON.stringify({ seededDevelopers: seeded, pinned, propUpdated }, null, 2),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
