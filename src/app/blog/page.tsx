import type { Metadata } from "next";
import Link from "next/link";

import { PageBuilderSection } from "@/features/marketing/page-builder-section";
import { PageHero } from "@/features/marketing/page-hero";
import { PublicBlogCard } from "@/features/marketing/public-blog-card";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { publicPageLoadError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { buildManagedPageMetadata } from "@/lib/managed-page-metadata";
import { organizationRepository } from "@/repositories/organization.repository";
import { blogService } from "@/services/blog.service";
import { pageContentService } from "@/services/page-content.service";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("blog", {
    title: "Blog",
    description:
      "Market insights, off-plan guides, and Dubai property updates from Prowin Properties.",
  });
}

type SearchParams = Promise<{ page?: string }>;

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

/** Windowed page list with nulls standing in for the ellipsis gaps. */
function pageNumbers(current: number, total: number, radius = 1) {
  const pages = new Set<number>([1, total]);
  for (let p = current - radius; p <= current + radius; p += 1) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | null> = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push(null);
    out.push(p);
    previous = p;
  }
  return out;
}

function PageStep({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="border border-line bg-white px-4 py-2 text-sm font-medium text-[#a3a3a3]"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-ink",
        FOCUS_RING,
      )}
    >
      {children}
    </Link>
  );
}

const EMPTY_RESULT = {
  items: [] as Awaited<
    ReturnType<typeof blogService.listPublished>
  >["items"],
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 1,
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  let pageContent;
  try {
    pageContent = await pageContentService.get("blog");
  } catch {
    const { DEFAULT_PAGE_CONTENT } = await import(
      "@/config/page-content-defaults"
    );
    pageContent = DEFAULT_PAGE_CONTENT.blog;
  }

  let result = EMPTY_RESULT;
  let loadError: string | null = null;
  try {
    const org = await organizationRepository.getDefault();
    result = org
      ? await blogService.listPublished(org.id, page, 12)
      : EMPTY_RESULT;
  } catch (error) {
    loadError = publicPageLoadError(
      error,
      "Blog posts are temporarily unavailable. Please try again.",
    );
    console.error("[blog] listPublished failed:", error);
  }

  const pageOutOfRange = result.total > 0 && page > result.totalPages;

  return (
    <PublicSiteShell>
      <main>
        <PageHero
          eyebrow={pageContent.eyebrow}
          title={pageContent.title}
          description={pageContent.lede}
        />
        <PageBuilderSection blocks={pageContent.blocks} />

        <section className="bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-12 md:py-16">
            {loadError ? (
              <div className="border border-dashed border-line bg-white px-6 py-16 text-center">
                <p className="font-display text-2xl">Temporarily unavailable</p>
                <p className="mt-2 text-sm text-slate">{loadError}</p>
                <Link
                  href="/blog"
                  className="mt-6 inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                >
                  Try again
                </Link>
              </div>
            ) : pageOutOfRange ? (
              <div className="border border-dashed border-line bg-white px-6 py-16 text-center">
                <p className="font-display text-2xl">That page doesn&apos;t exist</p>
                <p className="mt-2 text-sm text-slate">
                  This blog has {result.totalPages} page
                  {result.totalPages === 1 ? "" : "s"} of articles.
                </p>
                <Link
                  href="/blog"
                  className="mt-6 inline-flex items-center border border-ink px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                >
                  Back to page 1
                </Link>
              </div>
            ) : result.items.length === 0 ? (
              <div className="border border-dashed border-line bg-white px-6 py-16 text-center">
                <p className="font-display text-2xl">No articles published yet</p>
                <p className="mt-2 text-sm text-slate">
                  New posts from the admin blog will appear here when published.
                </p>
                <Link
                  href="/properties"
                  className="mt-6 inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                >
                  Browse properties
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {result.items.map((post) => (
                    <PublicBlogCard key={post.id} post={post} />
                  ))}
                </div>
                {result.totalPages > 1 ? (
                  <nav
                    aria-label="Blog pagination"
                    className="mt-10 flex flex-wrap items-center justify-center gap-2"
                  >
                    <PageStep
                      href={`/blog?page=${result.page - 1}`}
                      disabled={result.page <= 1}
                      label="Previous page"
                    >
                      Previous
                    </PageStep>
                    {pageNumbers(result.page, result.totalPages).map((p, i) =>
                      p === null ? (
                        <span
                          key={`gap-${i}`}
                          className="px-1 text-sm text-slate"
                          aria-hidden="true"
                        >
                          …
                        </span>
                      ) : (
                        <Link
                          key={p}
                          href={`/blog?page=${p}`}
                          aria-label={`Page ${p}`}
                          aria-current={p === result.page ? "page" : undefined}
                          className={cn(
                            "min-w-10 border px-3 py-2 text-center text-sm font-medium transition",
                            FOCUS_RING,
                            p === result.page
                              ? "border-ink bg-ink text-white"
                              : "border-line bg-white text-ink hover:border-ink",
                          )}
                        >
                          {p}
                        </Link>
                      ),
                    )}
                    <PageStep
                      href={`/blog?page=${result.page + 1}`}
                      disabled={result.page >= result.totalPages}
                      label="Next page"
                    >
                      Next
                    </PageStep>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
