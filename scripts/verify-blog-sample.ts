import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { splitBlogCover } = await import("../src/lib/blog-content");

  const all = await prisma.blogPost.findMany({
    where: { deletedAt: null },
    select: {
      slug: true,
      title: true,
      content: true,
      excerpt: true,
      workflowState: true,
      publishedAt: true,
    },
  });

  let published = 0;
  let blobCovers = 0;
  let propphyRefs = 0;
  let missingCover = 0;
  const sample: Array<Record<string, unknown>> = [];

  for (const p of all) {
    const { coverUrl, body } = splitBlogCover(p.content);
    if (p.workflowState === "PUBLISHED") published++;
    if (coverUrl?.includes("blob.vercel-storage.com")) blobCovers++;
    else if (p.workflowState === "PUBLISHED") missingCover++;
    if ((p.content ?? "").includes("propphy.com")) propphyRefs++;

    if (p.workflowState === "PUBLISHED" && sample.length < 3) {
      sample.push({
        slug: p.slug,
        publishedAt: p.publishedAt?.toISOString().slice(0, 10),
        coverHost: coverUrl ? new URL(coverUrl).hostname : null,
        bodyImages: (body.match(/<img/gi) || []).length,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        totals: {
          posts: all.length,
          published,
          drafts: all.length - published,
          publishedWithBlobCover: blobCovers,
          publishedMissingCover: missingCover,
          postsStillReferencingPropphy: propphyRefs,
        },
        sample,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main();
