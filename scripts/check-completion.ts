import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const bySource = await p.property.groupBy({
    by: ["source"],
    where: { deletedAt: null, status: "PUBLISHED" },
    _count: true,
  });
  const construction = await p.property.groupBy({
    by: ["constructionStatus"],
    where: { deletedAt: null, status: "PUBLISHED" },
    _count: true,
  });
  console.log(JSON.stringify({ bySource, construction }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
