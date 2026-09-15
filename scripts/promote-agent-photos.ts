/**
 * Copies locally uploaded agent photos into a git-tracked folder and points
 * the live database at those URLs so Vercel can serve the same files.
 *
 * Usage: npx tsx scripts/promote-agent-photos.ts
 */
import { config } from "dotenv";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
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

function diskPathFromUrl(photoUrl: string) {
  return path.join(
    process.cwd(),
    "public",
    photoUrl.replace(/^\//, "").replaceAll("/", path.sep),
  );
}

async function main() {
  const destDir = path.join(process.cwd(), "public", "media", "agents");
  mkdirSync(destDir, { recursive: true });

  const prisma = new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
  });

  try {
    const agents = await prisma.agent.findMany({
      where: { deletedAt: null, photoUrl: { not: null } },
      select: { id: true, name: true, slug: true, photoUrl: true, photoMediaId: true },
    });

    for (const agent of agents) {
      const sourceUrl = agent.photoUrl!;
      if (sourceUrl.startsWith("/media/agents/")) {
        console.log(`skip ${agent.slug} (already promoted)`);
        continue;
      }
      if (!sourceUrl.startsWith("/uploads/")) {
        console.log(`skip ${agent.slug} (external url)`);
        continue;
      }

      const source = diskPathFromUrl(sourceUrl);
      if (!existsSync(source)) {
        console.log(`MISSING FILE ${agent.slug} ${sourceUrl}`);
        continue;
      }

      const ext = path.extname(source) || ".jpg";
      const destName = `${agent.slug}${ext.toLowerCase()}`;
      const dest = path.join(destDir, destName);
      copyFileSync(source, dest);

      const nextUrl = `/media/agents/${destName}`;
      await prisma.agent.update({
        where: { id: agent.id },
        data: { photoUrl: nextUrl },
      });

      if (agent.photoMediaId) {
        await prisma.mediaAsset.updateMany({
          where: { id: agent.photoMediaId },
          data: { url: nextUrl },
        });
      } else {
        await prisma.mediaAsset.updateMany({
          where: { url: sourceUrl, deletedAt: null },
          data: { url: nextUrl },
        });
      }

      console.log(`promoted ${agent.name} -> ${nextUrl}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
