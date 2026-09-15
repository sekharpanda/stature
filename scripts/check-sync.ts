import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.property.count({
    where: { source: "LEADRAT", deletedAt: null },
  });
  const withCover = await prisma.property.count({
    where: {
      source: "LEADRAT",
      deletedAt: null,
      images: { some: { deletedAt: null } },
    },
  });
  const images = await prisma.propertyImage.count({
    where: { deletedAt: null },
  });
  const jobs = await prisma.syncJob.findMany({
    where: { provider: "leadrat" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      createdAt: true,
      finishedAt: true,
      error: true,
      result: true,
    },
  });
  const sample = await prisma.property.findMany({
    where: { source: "LEADRAT", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      name: true,
      saleStatus: true,
      completionLabel: true,
      minPrice: true,
      leadratProjectId: true,
      images: {
        where: { deletedAt: null, isCover: true },
        take: 1,
        select: { url: true },
      },
    },
  });
  console.log(JSON.stringify({ total, withCover, images, jobs, sample }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
