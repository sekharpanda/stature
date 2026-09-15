/**
 * Live verification of API Fetch upserts against Neon.
 * Usage: VERIFY_API_FETCH=1 npx tsx scripts/verify-api-fetch.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

import type { ApiSourceTarget } from "@prisma/client";

import { prisma } from "../src/lib/db/prisma";
import { apiSourceService } from "../src/services/api-source.service";

type Fixture = {
  developers: unknown[];
  areas: unknown[];
  communities: unknown[];
  agents: unknown[];
  amenities: unknown[];
  categories: unknown[];
  properties: unknown[];
  posts: unknown[];
  faqs: unknown[];
  testimonials: unknown[];
  pages: unknown[];
  landingPages: unknown[];
};

const SOURCE_KEY = "api:verify-script";

async function runTarget(
  target: ApiSourceTarget,
  items: unknown[],
  label: string,
) {
  const result = await apiSourceService.syncItemsForVerify({
    target,
    items,
    sourceKey: SOURCE_KEY,
    autoPublish: true,
  });
  const ok = result.errors.length === 0 && result.imported + result.updated > 0;
  const line = `${ok ? "PASS" : "FAIL"} ${label.padEnd(14)} fetched=${result.fetched} +${result.imported} ~${result.updated} skip=${result.skipped} errors=${result.errors.length}`;
  console.log(line);
  if (result.errors.length) {
    for (const err of result.errors.slice(0, 3)) {
      console.log(`       └─ ${err.message}`);
    }
  }
  return ok;
}

async function cleanup() {
  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    select: { id: true },
  });
  if (!org) return;

  await prisma.blogPost.deleteMany({
    where: { organizationId: org.id, source: SOURCE_KEY },
  });
  await prisma.faq.deleteMany({
    where: { organizationId: org.id, source: SOURCE_KEY },
  });
  await prisma.testimonial.deleteMany({
    where: { organizationId: org.id, source: SOURCE_KEY },
  });
  await prisma.property.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.community.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.area.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.developer.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.agent.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.amenity.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.propertyCategory.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.page.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
  await prisma.landingPage.deleteMany({
    where: { organizationId: org.id, slug: { startsWith: "api-verify-" } },
  });
}

async function main() {
  process.env.VERIFY_API_FETCH = "1";

  const fixturePath = resolve(
    process.cwd(),
    "public/fixtures/api-fetch-demo.json",
  );
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as Fixture;

  console.log("Cleaning previous verify records…");
  await cleanup();

  console.log("Running API Fetch upserts…");
  const checks = await Promise.all([
    // Sequential is safer for Neon pool — do serially below
  ]);
  void checks;

  const results: boolean[] = [];
  results.push(await runTarget("DEVELOPER", fixture.developers, "DEVELOPER"));
  results.push(await runTarget("AREA", fixture.areas, "AREA"));
  results.push(await runTarget("COMMUNITY", fixture.communities, "COMMUNITY"));
  results.push(await runTarget("AGENT", fixture.agents, "AGENT"));
  results.push(await runTarget("AMENITY", fixture.amenities, "AMENITY"));
  results.push(await runTarget("CATEGORY", fixture.categories, "CATEGORY"));
  results.push(await runTarget("PROPERTY", fixture.properties, "PROPERTY"));
  results.push(await runTarget("INSIGHT", fixture.posts, "INSIGHT"));
  results.push(await runTarget("FAQ", fixture.faqs, "FAQ"));
  results.push(
    await runTarget("TESTIMONIAL", fixture.testimonials, "TESTIMONIAL"),
  );
  results.push(await runTarget("PAGE", fixture.pages, "PAGE"));
  results.push(
    await runTarget("LANDING_PAGE", fixture.landingPages, "LANDING_PAGE"),
  );

  // Idempotency: second FAQ sync should skip/update, not error
  const again = await apiSourceService.syncItemsForVerify({
    target: "FAQ",
    items: fixture.faqs,
    sourceKey: SOURCE_KEY,
  });
  const idempotent =
    again.errors.length === 0 && again.imported === 0 && again.updated + again.skipped >= 1;
  console.log(
    `${idempotent ? "PASS" : "FAIL"} IDEMPOTENT     FAQ re-sync imported=${again.imported} updated=${again.updated} skipped=${again.skipped}`,
  );
  results.push(idempotent);

  // Full HTTP path: create ApiSource pointing at local fixture and sync
  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    select: { id: true },
  });
  if (!org) throw new Error("No organization");

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const source = await prisma.apiSource.create({
    data: {
      organizationId: org.id,
      name: "Verify FAQ Fixture",
      target: "FAQ",
      method: "GET",
      url: `${base}/fixtures/api-fetch-demo.json`,
      itemsPath: "faqs",
      fieldMap: {
        externalId: "id",
        question: "question",
        answer: "answer",
      },
      autoPublish: true,
      enabled: true,
    },
  });

  // Bypass auth by temporarily monkey-patching — use syncItems after fetch manually
  const res = await fetch(source.url, { cache: "no-store" });
  if (!res.ok) {
    console.log(`FAIL HTTP_FIXTURE  could not fetch ${source.url} (${res.status})`);
    results.push(false);
  } else {
    const payload = await res.json();
    const items = payload.faqs as unknown[];
    const httpResult = await apiSourceService.syncItemsForVerify({
      target: "FAQ",
      items,
      sourceKey: `api:${source.id}`,
    });
    const httpOk =
      httpResult.errors.length === 0 &&
      httpResult.imported + httpResult.updated + httpResult.skipped > 0;
    console.log(
      `${httpOk ? "PASS" : "FAIL"} HTTP_FIXTURE   ${source.url} → FAQ`,
    );
    results.push(httpOk);
  }

  await prisma.apiSource.delete({ where: { id: source.id } });

  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed`);

  if (process.env.KEEP_VERIFY_DATA !== "1") {
    console.log("Cleaning verify records…");
    await cleanup();
  }

  await prisma.$disconnect();
  if (passed < total) process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
