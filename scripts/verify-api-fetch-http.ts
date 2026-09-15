import { prisma } from "../src/lib/db/prisma";
import { apiSourceService } from "../src/services/api-source.service";

async function main() {
  process.env.VERIFY_API_FETCH = "1";
  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    select: { id: true },
  });
  if (!org) throw new Error("no org");

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const source = await prisma.apiSource.create({
    data: {
      organizationId: org.id,
      name: "E2E Verify Developers",
      target: "DEVELOPER",
      method: "GET",
      url: `${base}/fixtures/api-fetch-demo.json`,
      itemsPath: "developers",
      fieldMap: {
        externalId: "id",
        name: "name",
        slug: "slug",
        shortDescription: "shortDescription",
        website: "website",
      },
      autoPublish: true,
      enabled: true,
    },
  });

  const result = await apiSourceService.sync(source.id);
  const job = await prisma.syncJob.findFirst({
    where: { provider: `api-source:${source.id}` },
    orderBy: { createdAt: "desc" },
  });

  console.log(
    JSON.stringify(
      {
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        fetched: result.fetched,
        errors: result.errors,
        durationMs: result.durationMs,
        jobStatus: job?.status,
        jobType: job?.type,
      },
      null,
      2,
    ),
  );

  await prisma.developer.deleteMany({
    where: { organizationId: org.id, slug: "api-verify-developer" },
  });
  await prisma.apiSource.delete({ where: { id: source.id } });
  await prisma.$disconnect();

  if (result.errors.length || result.imported + result.updated < 1) {
    process.exit(1);
  }
  if (job?.status !== "SUCCESS" && job?.status !== "PARTIAL") {
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
