/**
 * Phase 1 seed
 *   npx prisma db push
 *   npm run db:seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { ROLE_SLUGS } from "../src/constants/permissions";
import { syncPermissionsAndRoles } from "../src/lib/db/sync-permissions";
import { syncTeamRoster } from "../src/lib/db/sync-team-roster";

const prisma = new PrismaClient();

async function seedPermissionsAndRoles(organizationId: string) {
  console.log("Seeding permissions and roles…");
  const outcomes = await syncPermissionsAndRoles(prisma, organizationId);
  for (const outcome of outcomes) {
    console.log(
      `  ${outcome.slug.padEnd(18)} +${outcome.granted.length} -${outcome.revoked.length}`,
    );
  }
}

async function seedAdmin(organizationId: string) {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@prowinproperties.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeNow!123";
  const name = process.env.SEED_ADMIN_NAME ?? "Prowin Admin";

  console.log(`Seeding admin ${email}…`);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const hashed = await hashPassword(password);
    user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerified: true,
        organizationId,
        status: "ACTIVE",
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password: hashed,
          },
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId, status: "ACTIVE" },
    });

    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });

    if (!existingAccount) {
      const hashed = await hashPassword(password);
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: email,
          providerId: "credential",
          password: hashed,
        },
      });
    }
  }

  const role = await prisma.role.findFirst({
    where: { organizationId, slug: ROLE_SLUGS.SUPER_ADMIN, deletedAt: null },
  });

  if (role) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  console.log(`Admin ready: ${email}`);
}

async function seedCatalog(organizationId: string) {
  console.log("Seeding Dubai catalog…");
  const country = await prisma.country.upsert({
    where: {
      organizationId_slug: { organizationId, slug: "uae" },
    },
    update: {},
    create: {
      organizationId,
      name: "United Arab Emirates",
      slug: "uae",
      isoCode: "AE",
    },
  });

  const city = await prisma.city.upsert({
    where: {
      organizationId_slug: { organizationId, slug: "dubai" },
    },
    update: {},
    create: {
      organizationId,
      countryId: country.id,
      name: "Dubai",
      slug: "dubai",
    },
  });

  const areaNames = [
    "Jumeirah Village Circle",
    "Business Bay",
    "Dubai South",
    "Dubai Marina",
    "Downtown Dubai",
    "Palm Jumeirah",
  ];

  for (const name of areaNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.area.upsert({
      where: {
        organizationId_slug: { organizationId, slug },
      },
      update: {},
      create: {
        organizationId,
        cityId: city.id,
        name,
        slug,
        isPublished: true,
        shortDescription: `${name} real estate in Dubai`,
      },
    });
  }

  console.log("Seeded UAE → Dubai → core areas");
}

async function seedAgents(organizationId: string) {
  console.log("Seeding public team agents…");
  const outcomes = await syncTeamRoster(prisma, organizationId);
  for (const outcome of outcomes) {
    console.log(`  ${outcome.action.padEnd(8)} ${outcome.name}`);
  }
}

async function main() {
  const orgName = process.env.SEED_ORG_NAME ?? "Prowin Properties";
  const orgSlug = process.env.SEED_ORG_SLUG ?? "prowin";

  console.log("Seeding organization…");
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: { name: orgName },
    create: {
      name: orgName,
      slug: orgSlug,
      email: "discover@prowinproperties.com",
      phone: "+971585808989",
      whatsapp: "+971585808989",
      address: "1004-1005, Icon Tower, Barsha Heights (Tecom)",
      city: "Dubai",
      country: "AE",
      primaryColor: "#A01919",
      secondaryColor: "#b08948",
      domain: "www.prowinproperties.com",
      defaultCurrency: "AED",
    },
  });

  await seedPermissionsAndRoles(org.id);
  await seedAdmin(org.id);
  await seedCatalog(org.id);
  await seedAgents(org.id);
  await seedSeoWebsiteSettings(org);

  console.log(`Seeded organization: ${org.name} (${org.id})`);
}

async function seedSeoWebsiteSettings(org: {
  id: string;
  name: string;
  domain: string | null;
}) {
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

  console.log(`Seeded ${defaults.length} SEO website settings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
