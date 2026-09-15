/**
 * Dry-run: count unique blog image URLs and estimate total storage for migration.
 *
 * Usage:
 *   npx tsx scripts/estimate-blog-image-migration.ts
 *   npx tsx scripts/estimate-blog-image-migration.ts --head
 *   npx tsx scripts/estimate-blog-image-migration.ts --head --sample 30
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

const STRAPI_BASE =
  process.env.STRAPI_ASSET_BASE_URL?.replace(/\/$/, "") ??
  "https://prowin.propphy.com";

const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/gi;

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${STRAPI_BASE}${trimmed}`;
  return trimmed;
}

function isMigratableUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("propphy.com") ||
      host.includes("prowinproperties.com") ||
      url.includes("/uploads/")
    );
  } catch {
    return url.includes("/uploads/");
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function headSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!res.ok) return null;
    const len = res.headers.get("content-length");
    if (!len) return null;
    const n = Number(len);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const useHead = args.includes("--head");
  const sampleIdx = args.indexOf("--sample");
  const sampleLimit =
    sampleIdx >= 0 ? Number(args[sampleIdx + 1]) || 20 : undefined;

  const { prisma } = await import("../src/lib/db/prisma");
  const { splitBlogCover } = await import("../src/lib/blog-content");

  const posts = await prisma.blogPost.findMany({
    where: { deletedAt: null },
    select: { id: true, content: true },
  });

  const urlToPosts = new Map<string, number>();
  let postsWithCover = 0;
  let postsWithInline = 0;
  let inlineImageRefs = 0;

  for (const post of posts) {
    const { coverUrl, body } = splitBlogCover(post.content);
    const urls: string[] = [];

    if (coverUrl) {
      const n = normalizeUrl(coverUrl);
      if (n) {
        urls.push(n);
        postsWithCover++;
      }
    }

    const inline = extractInlineImages(body);
    if (inline.length > 0) postsWithInline++;
    inlineImageRefs += inline.length;
    urls.push(...inline);

    for (const url of urls) {
      if (!isMigratableUrl(url)) continue;
      urlToPosts.set(url, (urlToPosts.get(url) ?? 0) + 1);
    }
  }

  const uniqueUrls = [...urlToPosts.keys()].sort();
  const propphyUrls = uniqueUrls.filter((u) => u.includes("propphy.com"));
  const totalReferences = [...urlToPosts.values()].reduce((a, b) => a + b, 0);

  let probeUrls = uniqueUrls;
  if (sampleLimit && sampleLimit < uniqueUrls.length) {
    probeUrls = uniqueUrls.slice(0, sampleLimit);
  }

  let totalBytes = 0;
  let sizedCount = 0;
  let failedHead = 0;
  const sized: Array<{ url: string; bytes: number }> = [];

  if (useHead && probeUrls.length > 0) {
    console.error(`Probing ${probeUrls.length} URL(s) with HEAD…`);
    const sizes = await mapPool(probeUrls, 8, headSize);
    for (let i = 0; i < probeUrls.length; i++) {
      const bytes = sizes[i];
      if (bytes != null) {
        totalBytes += bytes;
        sizedCount++;
        sized.push({ url: probeUrls[i]!, bytes });
      } else {
        failedHead++;
      }
    }
  }

  const avgBytes =
    sized.length > 0
      ? sized.reduce((a, b) => a + b.bytes, 0) / sized.length
      : null;

  const estimatedTotalBytes = avgBytes
    ? Math.round(avgBytes * uniqueUrls.length)
    : null;

  const vercelFreeBytes = 1024 * 1024 * 1024;

  console.log(
    JSON.stringify(
      {
        posts: {
          total: posts.length,
          withCover: postsWithCover,
          withInlineImages: postsWithInline,
          inlineImageReferences: inlineImageRefs,
        },
        images: {
          uniqueMigratableUrls: uniqueUrls.length,
          propphyUrls: propphyUrls.length,
          totalImageReferencesInPosts: totalReferences,
          dedupeSavedUploads: totalReferences - uniqueUrls.length,
        },
        sizing: useHead
          ? {
              probed: probeUrls.length,
              withContentLength: sizedCount,
              headFailed: failedHead,
              probedTotalBytes: totalBytes,
              probedTotalHuman: formatBytes(totalBytes),
              avgBytesPerImage: avgBytes ? Math.round(avgBytes) : null,
              avgHuman: avgBytes ? formatBytes(avgBytes) : null,
              estimatedAllImagesBytes: estimatedTotalBytes,
              estimatedAllImagesHuman: estimatedTotalBytes
                ? formatBytes(estimatedTotalBytes)
                : null,
              extrapolatedFromSample: Boolean(
                sampleLimit && sampleLimit < uniqueUrls.length,
              ),
              largestProbed: sized
                .sort((a, b) => b.bytes - a.bytes)
                .slice(0, 5)
                .map((x) => ({
                  url: x.url.slice(0, 100),
                  size: formatBytes(x.bytes),
                })),
            }
          : {
              note: "Run with --head to probe sizes (e.g. --head --sample 40)",
            },
        vercelHobbyFreeTier: {
          storageLimit: "1 GB",
          uploadOpsPerMonth: 2000,
          uniqueUploadsNeeded: uniqueUrls.length,
          fitsUploadOps: uniqueUrls.length <= 2000,
          fitsStorageEstimate70pctBudget:
            estimatedTotalBytes != null
              ? estimatedTotalBytes <= vercelFreeBytes * 0.7
              : null,
          estimatedPctOf1Gb:
            estimatedTotalBytes != null
              ? `${((estimatedTotalBytes / vercelFreeBytes) * 100).toFixed(1)}%`
              : null,
        },
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
