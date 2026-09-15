import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const ready = await p.property.updateMany({
    where: {
      deletedAt: null,
      completionStatus: null,
      OR: [
        { constructionStatus: { contains: "Completed", mode: "insensitive" } },
        { constructionStatus: { contains: "Ready", mode: "insensitive" } },
      ],
    },
    data: { completionStatus: "READY" },
  });
  const under = await p.property.updateMany({
    where: {
      deletedAt: null,
      completionStatus: null,
      constructionStatus: { contains: "Under", mode: "insensitive" },
    },
    data: { completionStatus: "UNDER_CONSTRUCTION" },
  });
  const offplan = await p.property.updateMany({
    where: { deletedAt: null, completionStatus: null },
    data: { completionStatus: "OFF_PLAN" },
  });
  console.log({ ready: ready.count, under: under.count, offplan: offplan.count });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
