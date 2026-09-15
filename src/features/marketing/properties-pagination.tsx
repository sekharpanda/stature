"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function buildPageHref(
  query: Record<string, string> | undefined,
  page: number,
  basePath = "/properties",
) {
  const sp = new URLSearchParams(query ?? {});
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const s = sp.toString();
  return s ? `${basePath}?${s}` : basePath;
}

function pageWindow(current: number, total: number, radius = 2) {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let p = current - radius; p <= current + radius; p += 1) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

function StepLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  // Keep the control in place when unavailable so the row doesn't reflow.
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="cursor-not-allowed border border-line px-3 py-2 text-sm font-semibold text-[#b6bec9]"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "border border-ink px-3 py-2 text-sm font-semibold transition hover:bg-ink hover:text-white",
        FOCUS_RING,
      )}
    >
      {children}
    </Link>
  );
}

export function PropertiesPagination({
  page,
  pageCount,
  query,
  /** @deprecated use query */
  q,
}: {
  page: number;
  pageCount: number;
  query?: Record<string, string>;
  q?: string;
}) {
  const router = useRouter();
  const [jump, setJump] = useState(String(page));
  const resolvedQuery = query ?? (q ? { q } : {});

  // Previous/Next navigate via links, so the input needs to follow along.
  useEffect(() => {
    setJump(String(page));
  }, [page]);

  if (pageCount <= 1) return null;

  const pages = pageWindow(page, pageCount);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-col items-center gap-4"
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <StepLink
          href={buildPageHref(resolvedQuery, page - 1)}
          disabled={page <= 1}
        >
          Previous
        </StepLink>

        {pages.map((p, index) => {
          const prev = pages[index - 1];
          const showEllipsis = prev != null && p - prev > 1;
          return (
            <span key={p} className="contents">
              {showEllipsis ? (
                <span className="px-1 text-sm text-slate" aria-hidden="true">
                  …
                </span>
              ) : null}
              <Link
                href={buildPageHref(resolvedQuery, p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "px-3 py-2 text-sm font-semibold transition",
                  FOCUS_RING,
                  p === page
                    ? "bg-ink text-white"
                    : "border border-line text-ink hover:border-ink",
                )}
              >
                {p}
              </Link>
            </span>
          );
        })}

        <StepLink
          href={buildPageHref(resolvedQuery, page + 1)}
          disabled={page >= pageCount}
        >
          Next
        </StepLink>
      </div>

      <form
        className="flex items-center gap-2 text-sm text-slate"
        onSubmit={(e) => {
          e.preventDefault();
          const next = Math.min(
            pageCount,
            Math.max(1, Number.parseInt(jump, 10) || 1),
          );
          router.push(buildPageHref(resolvedQuery, next));
        }}
      >
        <label htmlFor="jump-page">Go to page</label>
        <input
          id="jump-page"
          type="number"
          min={1}
          max={pageCount}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          className={cn(
            "h-9 w-20 rounded-[3px] border border-line bg-white px-2 text-ink outline-none",
            FOCUS_RING,
          )}
        />
        <span>of {pageCount}</span>
        <button
          type="submit"
          className={cn(
            "h-9 bg-red px-3 text-sm font-semibold text-white transition hover:bg-red-dark",
            FOCUS_RING,
          )}
        >
          Go
        </button>
      </form>
    </nav>
  );
}
