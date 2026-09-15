/**
 * Read-only roster audit.
 * Usage: npx tsx scripts/list-agents.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agent.findMany({
    orderBy: [{ deletedAt: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      name: true,
      slug: true,
      title: true,
      isActive: true,
      isFeatured: true,
      sortOrder: true,
      photoUrl: true,
      phone: true,
      whatsapp: true,
      email: true,
      bio: true,
      deletedAt: true,
      _count: { select: { properties: { where: { deletedAt: null } } } },
    },
  });

  for (const agent of agents) {
    console.log(
      [
        String(agent.sortOrder).padStart(2),
        agent.name.padEnd(26),
        agent.slug.padEnd(26),
        (agent.title ?? "—").padEnd(20),
        agent.isActive ? "active  " : "inactive",
        agent.deletedAt ? "DELETED" : "       ",
        `photo:${agent.photoUrl ? "y" : "n"}`,
        `phone:${agent.phone || agent.whatsapp ? "y" : "n"}`,
        `email:${agent.email ? "y" : "n"}`,
        `bio:${agent.bio ? "y" : "n"}`,
        `listings:${agent._count.properties}`,
      ].join(" "),
    );
  }
  console.log(`\n${agents.length} agent rows`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
