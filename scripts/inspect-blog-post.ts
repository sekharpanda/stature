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
  const slug = process.argv[2] ?? "dubai-landlord-rights-and-process";
  const { prisma } = await import("../src/lib/db/prisma");
  const { splitBlogCover } = await import("../src/lib/blog-content");

  const row = await prisma.blogPost.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      canonicalUrl: true,
      workflowState: true,
      publishedAt: true,
      source: true,
      externalId: true,
    },
  });

  if (!row) {
    const near = await prisma.blogPost.findMany({
      where: { slug: { contains: "landlord" }, deletedAt: null },
      select: { slug: true, workflowState: true },
      take: 10,
    });
    console.log(JSON.stringify({ found: false, similarSlugs: near }, null, 2));
    await prisma.$disconnect();
    return;
  }

  const { coverUrl, body } = splitBlogCover(row.content);

  let sanitizeError: string | null = null;
  let sanitizedLength = 0;
  try {
    const { sanitizeBlogHtml } = await import("../src/lib/blog-html");
    sanitizedLength = sanitizeBlogHtml(body).length;
  } catch (e) {
    sanitizeError = e instanceof Error ? e.message : String(e);
  }

  let metaError: string | null = null;
  try {
    const { buildPageMetadata } = await import("../src/lib/seo");
    buildPageMetadata({
      title: row.metaTitle || row.title,
      description: row.metaDescription || row.excerpt || "test",
      path: `/blog/${row.slug}`,
      image: coverUrl ?? undefined,
      type: "article",
      publishedTime: row.publishedAt?.toISOString(),
    });
  } catch (e) {
    metaError = e instanceof Error ? e.message : String(e);
  }

  console.log(
    JSON.stringify(
      {
        found: true,
        slug: row.slug,
        title: row.title,
        workflowState: row.workflowState,
        publishedAt: row.publishedAt,
        canonicalUrl: row.canonicalUrl,
        metaTitleLen: row.metaTitle?.length ?? 0,
        excerptLen: row.excerpt?.length ?? 0,
        coverUrl,
        bodyLength: body.length,
        bodyStart: body.slice(0, 200),
        sanitizedLength,
        sanitizeError,
        metaError,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack : e);
  process.exit(1);
});
