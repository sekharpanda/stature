/**
 * Publish imported blog posts, restoring original Strapi publish dates.
 *
 * Usage:
 *   npx tsx scripts/publish-blog-posts.ts --dry-run
 *   npx tsx scripts/publish-blog-posts.ts
 *
 * Posts with no real article body are skipped (leftovers from a bad import).
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(path: string) {
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
      process.env[key] = value.replace(/[\r\n]+/g, "");
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const MIN_BODY_LENGTH = 200;

async function fetchStrapiDates(token: string) {
  const dates = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const url = `https://prowin.propphy.com/api/blogs?fields[0]=Date_published&fields[1]=publishedAt&pagination[pageSize]=100&pagination[page]=${page}&locale=en`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) break;
    const json = (await res.json()) as {
      data?: Array<{ id?: number; attributes?: Record<string, unknown> }>;
      meta?: { pagination?: { pageCount?: number } };
    };
    for (const row of json.data ?? []) {
      const raw =
        (row.attributes?.Date_published as string | undefined) ||
        (row.attributes?.publishedAt as string | undefined);
      if (row.id != null && raw) dates.set(String(row.id), raw);
    }
    const pageCount = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
  }
  return dates;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const { prisma } = await import("../src/lib/db/prisma");
  const { splitBlogCover } = await import("../src/lib/blog-content");

  const source = await prisma.apiSource.findFirst({
    where: {
      deletedAt: null,
      name: { contains: "Strapi", mode: "insensitive" },
      authValue: { not: null },
    },
    select: { authValue: true },
  });

  const token = source?.authValue?.trim() || process.env.STRAPI_API_TOKEN?.trim();
  const strapiDates = token ? await fetchStrapiDates(token) : new Map();

  const posts = await prisma.blogPost.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      content: true,
      externalId: true,
      workflowState: true,
      publishedAt: true,
    },
  });

  const toPublish: Array<{ id: string; publishedAt: Date }> = [];
  const skipped: string[] = [];

  for (const post of posts) {
    const { body } = splitBlogCover(post.content);
    if (body.replace(/<[^>]+>/g, "").trim().length < MIN_BODY_LENGTH) {
      skipped.push(post.title);
      continue;
    }
    if (post.workflowState === "PUBLISHED" && post.publishedAt) continue;

    const raw = post.externalId ? strapiDates.get(post.externalId) : undefined;
    const parsed = raw ? new Date(raw) : null;
    const publishedAt =
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed
        : (post.publishedAt ?? new Date());

    toPublish.push({ id: post.id, publishedAt });
  }

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "publish",
        totalPosts: posts.length,
        willPublish: toPublish.length,
        skippedEmpty: skipped.length,
        skippedTitles: skipped.slice(0, 30),
        datesFromStrapi: strapiDates.size,
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    await prisma.$disconnect();
    return;
  }

  let published = 0;
  for (const item of toPublish) {
    await prisma.blogPost.update({
      where: { id: item.id },
      data: { workflowState: "PUBLISHED", publishedAt: item.publishedAt },
    });
    published++;
    if (published % 50 === 0) {
      console.error(`Published ${published}/${toPublish.length}…`);
    }
  }

  const [totalPublished, totalDrafts] = await Promise.all([
    prisma.blogPost.count({
      where: { deletedAt: null, workflowState: "PUBLISHED" },
    }),
    prisma.blogPost.count({
      where: { deletedAt: null, workflowState: "DRAFT" },
    }),
  ]);

  console.log(
    JSON.stringify({ published, totalPublished, totalDrafts }, null, 2),
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
