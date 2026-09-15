import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cleared = await prisma.syncJob.updateMany({
    where: { provider: "leadrat", status: "RUNNING" },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      error: "Interrupted — cleared for retry",
    },
  });
  console.log("cleared", cleared.count);

  const { runInventorySync } = await import(
    "../src/services/property-sync.service"
  );
  const { organizationRepository } = await import(
    "../src/repositories/organization.repository"
  );
  const org = await organizationRepository.getDefault();
  if (!org) throw new Error("No org");
  const result = await runInventorySync({
    organizationId: org.id,
    enrichDetails: true,
    markMissing: true,
    mode: "manual",
  });
  console.log(
    JSON.stringify(
      {
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        deleted: result.deleted,
        errors: result.errors.length,
        durationMs: result.durationMs,
        firstErrors: result.errors.slice(0, 3),
      },
      null,
      2,
    ),
  );

  const offplan = await prisma.property.count({
    where: {
      source: "LEADRAT",
      deletedAt: null,
      sync: { status: "SYNCED", apiVersion: "offplan-public" },
    },
  });
  const withImages = await prisma.property.count({
    where: {
      source: "LEADRAT",
      deletedAt: null,
      images: { some: { deletedAt: null } },
    },
  });
  console.log(JSON.stringify({ offplanSynced: offplan, withImages }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
