import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orgSlug = process.env.SEED_ORG_SLUG ?? "prowin";
  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, deletedAt: null },
  });

  if (!org) {
    throw new Error(`Organization not found for slug=${orgSlug}`);
  }

  const defaults: Array<{ key: string; value: string }> = [
    { key: "seo_default_title", value: `${org.name} | Real Estate` },
    {
      key: "seo_default_description",
      value: `Discover premium properties and investment opportunities with ${org.name}.`,
    },
    { key: "seo_og_site_name", value: org.name },
    {
      key: "seo_canonical_base",
      value: org.domain ? `https://${org.domain}` : "",
    },
    { key: "meta_robots_default", value: "index,follow" },
  ];

  for (const d of defaults) {
    await prisma.websiteSetting.upsert({
      where: {
        organizationId_key: { organizationId: org.id, key: d.key },
      },
      create: {
        organizationId: org.id,
        key: d.key,
        value: d.value,
      },
      update: {
        value: d.value,
        deletedAt: null,
      },
    });
  }

  console.log(
    JSON.stringify({
      ok: true,
      count: defaults.length,
      keys: defaults.map((d) => d.key),
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
