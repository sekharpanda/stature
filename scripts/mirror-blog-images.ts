/**
 * Mirror blog images from Strapi (propphy.com) to Vercel Blob and rewrite post URLs.
 *
 * Usage:
 *   npx tsx scripts/mirror-blog-images.ts --dry-run
 *   npx tsx scripts/mirror-blog-images.ts --limit-posts 5
 *   npx tsx scripts/mirror-blog-images.ts
 *
 * Requires BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob) in .env.local
 * or pass via environment. Use --allow-local only for dev smoke tests.
 */
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const CACHE_PATH = resolve(process.cwd(), "scripts/.blog-image-migration-cache.json");
const STRAPI_BASE =
  process.env.STRAPI_ASSET_BASE_URL?.replace(/\/$/, "") ??
  "https://prowin.propphy.com";
const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/gi;
const BLOB_HOST = "blob.vercel-storage.com";

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
    value = value.replace(/[\r\n]+/g, "");
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env.blob.pull"));
loadEnvFile(resolve(process.cwd(), ".env.vercel.production"));

type CacheFile = {
  version: 1;
  mapping: Record<string, string>;
};

function loadCache(): CacheFile {
  if (!existsSync(CACHE_PATH)) return { version: 1, mapping: {} };
  try {
    const parsed = JSON.parse(readFileSync(CACHE_PATH, "utf8")) as CacheFile;
    if (parsed.version === 1 && parsed.mapping) return parsed;
  } catch {
    // ignore corrupt cache
  }
  return { version: 1, mapping: {} };
}

function saveCache(cache: CacheFile) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${STRAPI_BASE}${trimmed}`;
  return trimmed;
}

function isSourceUrl(url: string) {
  if (url.includes(BLOB_HOST)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("propphy.com") ||
      host.includes("prowinproperties.com") ||
      url.includes("/uploads/")
    );
  } catch {
    return url.includes("/uploads/") && !url.includes(BLOB_HOST);
  }
}

function extractInlineImages(html: string) {
  const urls: string[] = [];
  for (const match of html.matchAll(IMG_SRC_RE)) {
    const normalized = normalizeUrl(match[1] ?? "");
    if (normalized) urls.push(normalized);
  }
  return urls;
}

function filenameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split("/").pop() || "image.bin";
    return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  } catch {
    return `image-${createHash("md5").update(url).digest("hex").slice(0, 12)}.bin`;
  }
}

function mimeFromFilename(name: string, fallback?: string | null) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return "image/jpeg";
  return fallback?.split(";")[0]?.trim() || "application/octet-stream";
}

function rewriteContentUrls(content: string, mapping: Record<string, string>) {
  let next = content;
  const entries = Object.entries(mapping).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [from, to] of entries) {
    if (!from || !to) continue;
    next = next.split(from).join(to);
  }
  return next;
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]!, idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const allowLocal = args.includes("--allow-local");
  const limitPostsIdx = args.indexOf("--limit-posts");
  const limitPosts =
    limitPostsIdx >= 0 ? Number(args[limitPostsIdx + 1]) || 5 : undefined;
  const limitImagesIdx = args.indexOf("--limit-images");
  const limitImages =
    limitImagesIdx >= 0 ? Number(args[limitImagesIdx + 1]) || 10 : undefined;
  return { dryRun, allowLocal, limitPosts, limitImages };
}

async function downloadImage(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = filenameFromUrl(url);
  const mimeType = mimeFromFilename(
    filename,
    res.headers.get("content-type"),
  );
  return { buffer, filename, mimeType, sizeBytes: buffer.byteLength };
}

async function main() {
  const { dryRun, allowLocal, limitPosts, limitImages } = parseArgs();

  if (!dryRun && !allowLocal && !process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Connect Vercel Blob and add the token to .env.local, or run with --allow-local for a dev-only smoke test.",
    );
  }

  const { prisma } = await import("../src/lib/db/prisma");
  const { splitBlogCover, embedBlogCover } = await import("../src/lib/blog-content");
  const { getMediaStorage } = await import("../src/providers/media");

  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  if (!org) throw new Error("Organization not found");

  let posts = await prisma.blogPost.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true, content: true },
    orderBy: { updatedAt: "desc" },
  });

  if (limitPosts && limitPosts > 0) {
    posts = posts.slice(0, limitPosts);
  }

  const cache = loadCache();
  const urlSet = new Set<string>();

  for (const post of posts) {
    const { coverUrl, body } = splitBlogCover(post.content);
    if (coverUrl) {
      const n = normalizeUrl(coverUrl);
      if (n && isSourceUrl(n)) urlSet.add(n);
    }
    for (const url of extractInlineImages(body)) {
      if (isSourceUrl(url)) urlSet.add(url);
    }
  }

  let urlsToMirror = [...urlSet].sort();
  if (limitImages && limitImages > 0) {
    urlsToMirror = urlsToMirror.slice(0, limitImages);
  }

  const alreadyMirrored = urlsToMirror.filter((u) => cache.mapping[u]);
  const pending = urlsToMirror.filter((u) => !cache.mapping[u]);

  console.error(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "migrate",
        organization: org.name,
        postsInScope: posts.length,
        uniqueSourceUrls: urlsToMirror.length,
        alreadyCached: alreadyMirrored.length,
        pendingUploads: pending.length,
        storage: process.env.BLOB_READ_WRITE_TOKEN
          ? "vercel-blob"
          : allowLocal
            ? "local"
            : "none",
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          samplePending: pending.slice(0, 10),
          sampleCached: alreadyMirrored.slice(0, 3).map((u) => ({
            from: u.slice(0, 80),
            to: cache.mapping[u]?.slice(0, 80),
          })),
        },
        null,
        2,
      ),
    );
    await prisma.$disconnect();
    return;
  }

  const storage = getMediaStorage();
  let uploaded = 0;
  let failed = 0;
  const errors: Array<{ url: string; message: string }> = [];

  await mapPool(pending, 4, async (sourceUrl, index) => {
    try {
      const { buffer, filename, mimeType } = await downloadImage(sourceUrl);
      const result = await storage.upload({
        organizationId: org.id,
        filename,
        mimeType,
        body: buffer,
        folder: "blog-migration",
      });
      cache.mapping[sourceUrl] = result.url;
      uploaded++;
      if ((index + 1) % 25 === 0 || index === pending.length - 1) {
        saveCache(cache);
      }
      if ((uploaded + failed) % 10 === 0) {
        console.error(`Progress: ${uploaded + failed}/${pending.length} uploads…`);
      }
    } catch (error) {
      failed++;
      errors.push({
        url: sourceUrl.slice(0, 120),
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });

  saveCache(cache);

  let postsUpdated = 0;
  for (const post of posts) {
    const original = post.content ?? "";
    const { coverUrl, body } = splitBlogCover(original);
    const rewrittenBody = rewriteContentUrls(body, cache.mapping);
    let newCover = coverUrl;
    if (coverUrl) {
      const normalized = normalizeUrl(coverUrl);
      if (normalized && cache.mapping[normalized]) {
        newCover = cache.mapping[normalized];
      }
    }
    const nextContent = embedBlogCover(rewrittenBody, newCover);
    if (nextContent !== original) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content: nextContent },
      });
      postsUpdated++;
    }
  }

  const remainingPropphy = await prisma.blogPost.count({
    where: {
      deletedAt: null,
      content: { contains: "propphy.com" },
    },
  });

  console.log(
    JSON.stringify(
      {
        uploaded,
        failed,
        cachedTotal: Object.keys(cache.mapping).length,
        postsUpdated,
        postsStillReferencingPropphy: remainingPropphy,
        errors: errors.slice(0, 15),
        errorCount: errors.length,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
