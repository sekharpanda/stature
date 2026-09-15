import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const orgs = await p.organization.findMany({
    select: { id: true, slug: true, name: true, isActive: true },
  });
  const total = await p.property.count();
  const published = await p.property.count({
    where: { deletedAt: null, status: "PUBLISHED" },
  });
  const draft = await p.property.count({
    where: { deletedAt: null, status: "DRAFT" },
  });
  const byStatus = await p.property.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: true,
  });
  const byCompletion = await p.property.groupBy({
    by: ["completionStatus"],
    where: { deletedAt: null, status: "PUBLISHED" },
    _count: true,
  });
  const sample = await p.property.findMany({
    where: { deletedAt: null },
    take: 5,
    orderBy: { updatedAt: "desc" },
    select: {
      name: true,
      status: true,
      completionStatus: true,
      organizationId: true,
      slug: true,
    },
  });
  console.log(
    JSON.stringify(
      {
        orgs,
        total,
        published,
        draft,
        byStatus,
        byCompletion,
        sample,
        seedSlug: process.env.SEED_ORG_SLUG,
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
  .finally(() => p.$disconnect());
