/**
 * Read-only checklist for hosting on the original domain.
 * Prints READY / MISSING only — never prints secret values.
 *
 * Usage: npx tsx scripts/check-cutover-readiness.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

import { getHostingReadiness } from "../src/lib/hosting-readiness";

function flag(ok: boolean) {
  return ok ? "READY" : "MISSING";
}

function datasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return null;
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
  const ready = getHostingReadiness();

  console.log("Original site cutover");
  console.log(`  canonical domain: ${ready.canonical}`);
  console.log(`  NEXT_PUBLIC_APP_URL: ${ready.appUrl}`);
  console.log(`  BETTER_AUTH_URL: ${ready.authUrl}`);
  console.log(`  app URL is original domain: ${flag(ready.onCanonical)}`);
  console.log(`  APP_URL matches AUTH_URL: ${flag(ready.urlsMatch)}`);
  console.log(`  BETTER_AUTH_SECRET: ${flag(ready.authSecret)}`);
  console.log(`  email (SMTP or Resend): ${flag(ready.emailConfigured)}`);
  console.log(`  SMTP_USER: ${flag(ready.smtpUser)}`);
  console.log(`  SMTP_PASS: ${flag(ready.smtpPass)}`);
  console.log(`  EMAIL_FROM: ${flag(ready.emailFrom)}`);
  console.log(`  Vercel Blob uploads: ${flag(ready.blobConfigured)}`);
  console.log(`  Google Maps / Places: ${flag(ready.maps)}`);
  console.log(`  GOOGLE_PLACE_ID: ${flag(ready.placeId)}`);
  console.log(`  CRON_SECRET: ${flag(ready.cron)}`);

  const dbUrl = datasourceUrl();
  if (!dbUrl) {
    console.log("  DATABASE_URL: MISSING");
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    const [agents, withLogin, withPhoto, pending] = await Promise.all([
      prisma.agent.count({ where: { deletedAt: null } }),
      prisma.agent.count({
        where: { deletedAt: null, userId: { not: null } },
      }),
      prisma.agent.count({
        where: { deletedAt: null, photoUrl: { not: null } },
      }),
      prisma.contentSubmission.count({
        where: { status: "PENDING", deletedAt: null },
      }),
    ]);

    const missingPhoto = await prisma.agent.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ photoUrl: null }, { photoUrl: "" }],
      },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    });

    console.log("");
    console.log("Team / portal");
    console.log(`  agents: ${agents}`);
    console.log(`  linked logins: ${withLogin}/${agents}`);
    console.log(`  photos set: ${withPhoto}/${agents}`);
    console.log(`  pending approvals: ${pending}`);
    if (missingPhoto.length > 0) {
      console.log("  missing photos:");
      for (const agent of missingPhoto) {
        console.log(`    - ${agent.name} (${agent.slug})`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("");
  console.log(
    ready.onCanonical && ready.emailConfigured && ready.blobConfigured
      ? "Cutover blockers: none of the hosting env checks failed."
      : "Cutover blockers remain — set the MISSING env vars on the original-domain Vercel project, then invite consultants.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
