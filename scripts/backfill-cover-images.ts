/**
 * Backfill cover images for LeadRat properties that have none.
 * Pulls cover URLs from the public Off Plan list API (fast, no detail calls).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { offPlanClient } from "../src/providers/leadrat/offplan-client";
import { getOffPlanConfig } from "../src/providers/leadrat/offplan-config";

const prisma = new PrismaClient();

function preferUrl(
  primary?: string | null,
  fallback?: string | null,
): string | null {
  const a = primary?.trim();
  const b = fallback?.trim();
  if (b && /reelly-backend\.s3\.amazonaws\.com/i.test(b)) return b;
  if (a && !/[?&]X-Amz-/i.test(a)) return a;
  if (b) return b;
  return a || null;
}

async function main() {
  const cfg = getOffPlanConfig();
  let page = 1;
  let totalPages = 1;
  let created = 0;
  let skipped = 0;
  let missingLocal = 0;

  while (page <= totalPages && page <= 80) {
    const response = await offPlanClient.listListings({
      page,
      pageSize: 50,
      config: {
        apiKey: cfg.apiKey,
        baseUrl: cfg.baseUrl,
      },
    });
    totalPages = Number(response.totalPages ?? 1);

    for (const listing of response.results ?? []) {
      const cover = preferUrl(
        listing.coverImageUrl,
        listing.coverImageFallbackUrl,
      );
      if (!cover || !listing.id) {
        skipped += 1;
        continue;
      }

      const property = await prisma.property.findFirst({
        where: {
          leadratProjectId: listing.id,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          images: {
            where: { deletedAt: null },
            take: 1,
            select: { id: true },
          },
        },
      });

      if (!property) {
        missingLocal += 1;
        continue;
      }
      if (property.images.length > 0) {
        skipped += 1;
        continue;
      }

      await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          url: cover,
          galleryKind: "COVER",
          alt: listing.name ?? property.name,
          isCover: true,
          sortOrder: 0,
        },
      });
      created += 1;
    }

    console.log(
      JSON.stringify({ page, totalPages, created, skipped, missingLocal }),
    );
    page += 1;
  }

  const withImg = await prisma.property.count({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      images: { some: { deletedAt: null } },
    },
  });
  console.log(JSON.stringify({ done: true, created, withImg }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
