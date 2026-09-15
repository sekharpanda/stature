/**
 * One-off Strapi blog import (all pages, drafts by default).
 *
 * Usage:
 *   STRAPI_API_TOKEN="..." npx tsx scripts/import-strapi-blogs.ts
 *
 * Optional:
 *   STRAPI_AUTO_PUBLISH=1   — publish on import (default: drafts)
 */
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

const STRAPI_URL =
  "https://prowin.propphy.com/api/blogs?populate=*&pagination[pageSize]=100&locale=en&sort=Title:ASC";

const FIELD_MAP = {
  externalId: "id",
  title: "attributes.Title",
  slug: "attributes.slug",
  excerpt: "attributes.Blog_brief",
  content: "attributes.Content",
  publishedAt: "attributes.Date_published",
  coverUrl: "attributes.Main_image.data.attributes.url",
  metaTitle: "attributes.Meta_title",
  metaDescription: "attributes.Meta_description",
};

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");
  const { apiSourceService } = await import("../src/services/api-source.service");

  process.env.VERIFY_API_FETCH = "1";

  const token = process.env.STRAPI_API_TOKEN?.trim();
  if (!token) {
    throw new Error("Set STRAPI_API_TOKEN to your Strapi read token.");
  }

  const autoPublish = process.env.STRAPI_AUTO_PUBLISH === "1";

  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  if (!org) throw new Error("Organization not found in database.");

  const sourceName = "Strapi blogs (CLI import)";
  const existing = await prisma.apiSource.findFirst({
    where: { organizationId: org.id, name: sourceName, deletedAt: null },
    select: { id: true },
  });

  const source = existing
    ? await prisma.apiSource.update({
        where: { id: existing.id },
        data: {
          url: STRAPI_URL,
          itemsPath: "data",
          fieldMap: FIELD_MAP,
          authType: "bearer",
          authValue: token,
          autoPublish,
          enabled: true,
        },
      })
    : await prisma.apiSource.create({
        data: {
          organizationId: org.id,
          name: sourceName,
          target: "BLOG",
          method: "GET",
          url: STRAPI_URL,
          itemsPath: "data",
          fieldMap: FIELD_MAP,
          authType: "bearer",
          authValue: token,
          autoPublish,
          enabled: true,
        },
      });

  console.log(`Importing Strapi blogs for ${org.name}…`);
  console.log(`Auto-publish: ${autoPublish ? "yes" : "no (drafts)"}`);

  const result = await apiSourceService.sync(source.id);

  const [total, drafts, published] = await Promise.all([
    prisma.blogPost.count({
      where: { organizationId: org.id, deletedAt: null },
    }),
    prisma.blogPost.count({
      where: {
        organizationId: org.id,
        deletedAt: null,
        workflowState: "DRAFT",
      },
    }),
    prisma.blogPost.count({
      where: {
        organizationId: org.id,
        deletedAt: null,
        workflowState: "PUBLISHED",
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        fetched: result.fetched,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors.slice(0, 10),
        errorCount: result.errors.length,
        durationMs: result.durationMs,
        dbTotals: { total, drafts, published },
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
