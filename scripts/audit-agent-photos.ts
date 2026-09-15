/**
 * Audit agent photos vs files on disk. Read-only.
 * Usage: npx tsx scripts/audit-agent-photos.ts
 */
import { config } from "dotenv";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

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

function localPath(photoUrl: string | null) {
  if (!photoUrl) return null;
  if (!photoUrl.startsWith("/uploads/")) return null;
  return path.join(process.cwd(), "public", photoUrl.replace(/^\//, "").replaceAll("/", path.sep));
}

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
  });
  try {
    const agents = await prisma.agent.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true, photoUrl: true, isActive: true },
    });

    for (const agent of agents) {
      const file = localPath(agent.photoUrl);
      const onDisk = file && existsSync(file);
      const size = onDisk && file ? statSync(file).size : 0;
      console.log(
        [
          agent.name.padEnd(28),
          agent.slug.padEnd(28),
          agent.photoUrl ? "url:y" : "url:n",
          onDisk ? `disk:y ${size}` : "disk:n",
          agent.photoUrl ?? "—",
        ].join("  "),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
