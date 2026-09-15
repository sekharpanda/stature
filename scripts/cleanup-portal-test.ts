/**
 * Removes the end-to-end portal test data. Only matches the test email prefix
 * and listing prefix below, so it cannot touch real consultants or listings.
 *
 * Usage:
 *   npx tsx scripts/cleanup-portal-test.ts            # every portal.test* account
 *   npx tsx scripts/cleanup-portal-test.ts <email>    # just that one account
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

/** Matches portal.test@..., portal.test2@..., etc. */
const TEST_EMAIL_PREFIX = "portal.test";
const TEST_LISTING_PREFIX = "ZZ Test Listing";

function datasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  try {
    const url = new URL(raw);
    url.searchParams.set("connect_timeout", "60");
    url.searchParams.set("pool_timeout", "60");
    return url.toString();
  } catch {
    return raw;
  }
}

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
  });

  try {
    const onlyEmail = process.argv[2]?.trim();
    if (onlyEmail && !onlyEmail.startsWith(TEST_EMAIL_PREFIX)) {
      throw new Error(
        `Refusing to delete ${onlyEmail}: this script only handles ${TEST_EMAIL_PREFIX}* accounts.`,
      );
    }

    const users = await prisma.user.findMany({
      where: onlyEmail
        ? { email: onlyEmail }
        : { email: { startsWith: TEST_EMAIL_PREFIX } },
      select: { id: true, name: true, email: true },
    });

    if (users.length === 0) {
      console.log(
        `No users matching ${onlyEmail ?? `${TEST_EMAIL_PREFIX}*`}; nothing to clean.`,
      );
    }

    // Listings belong to the whole test run, so only sweep them in full cleanup.
    const listings = onlyEmail
      ? []
      : await prisma.property.findMany({
          where: { name: { startsWith: TEST_LISTING_PREFIX } },
          select: { id: true, name: true, status: true },
        });
    for (const listing of listings) {
      await prisma.property.delete({ where: { id: listing.id } });
      console.log(`deleted listing: ${listing.name} (was ${listing.status})`);
    }

    for (const user of users) {
      const submissions = await prisma.contentSubmission.deleteMany({
        where: { submittedById: user.id },
      });
      console.log(`deleted submissions: ${submissions.count}`);

      const agents = await prisma.agent.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, slug: true },
      });
      for (const agent of agents) {
        await prisma.agent.delete({ where: { id: agent.id } });
        console.log(`deleted agent profile: ${agent.name} (${agent.slug})`);
      }

      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.account.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`deleted user: ${user.name} <${user.email}>`);
    }

    console.log("cleanup complete");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
