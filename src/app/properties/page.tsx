import Link from "next/link";
import type { Metadata } from "next";
import type { VirtualTourType } from "@prisma/client";

import { PublicPropertyCard } from "@/features/marketing/public-property-card";
import {
  PublicPropertiesFilterBar,
  type PublicPropertyFiltersState,
} from "@/features/marketing/public-properties-filter-bar";
import {
  buildPageHref,
  PropertiesPagination,
} from "@/features/marketing/properties-pagination";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { publicPageLoadError } from "@/lib/errors";
import { normalizeCompletionParam } from "@/lib/property-filters";
import { buildPageMetadata } from "@/lib/seo";
import type { PropertySort } from "@/repositories/property.repository";
import { propertyService } from "@/services/property.service";

export const metadata: Metadata = buildPageMetadata({
  title: "Properties for sale in Dubai",
  description:
    "Browse published off-plan and ready properties in Dubai with Prowin Properties.",
  path: "/properties",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

const SORT_VALUES = ["price-asc", "price-desc", "newest", "handover"] as const;

function toSort(value?: string): PropertySort | undefined {
  return SORT_VALUES.includes(value as PropertySort)
    ? (value as PropertySort)
    : undefined;
}

const VIRTUAL_TOUR_PARAMS: Record<string, "any" | VirtualTourType> = {
  any: "any",
  "360": "TOUR_360",
  video: "VIDEO",
  live: "LIVE",
};

function toVirtualTour(value?: string) {
  return value ? VIRTUAL_TOUR_PARAMS[value] : undefined;
}

export default async function PublicPropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const qRaw = first(params.q)?.trim();
  const keywords = first(params.keywords)?.trim();
  const q = [qRaw, keywords].filter(Boolean).join(" ") || undefined;

  const filters: PublicPropertyFiltersState = {
    q: qRaw,
    type: first(params.type) || first(params.propertyType),
    beds: first(params.beds),
    priceMin: first(params.priceMin),
    priceMax: first(params.priceMax),
    completion: normalizeCompletionParam(first(params.completion)),
    furnishing: first(params.furnishing) || "ANY",
    sizeMin: first(params.sizeMin),
    sizeMax: first(params.sizeMax),
    priceSqftMin: first(params.priceSqftMin),
    priceSqftMax: first(params.priceSqftMax),
    amenity: first(params.amenity),
    keywords,
    viewing: first(params.viewing),
    cashback: first(params.cashback),
    sort: first(params.sort),
  };

  const page = Math.max(1, Number(first(params.page) ?? "1") || 1);
  const sort = toSort(filters.sort);
  const completion = normalizeCompletionParam(filters.completion);
  const furnishing =
    filters.furnishing === "FURNISHED" ||
    filters.furnishing === "UNFURNISHED" ||
    filters.furnishing === "PARTLY" ||
    filters.furnishing === "SEMI_FURNISHED"
      ? filters.furnishing
      : undefined;

  let result = {
    items: [] as Awaited<
      ReturnType<typeof propertyService.listPublished>
    >["items"],
    total: 0,
    page: 1,
    pageSize: 24,
    pageCount: 1,
  };
  let facets = { types: [] as Array<{ value: string; label: string }>, amenities: [] as Array<{ value: string; label: string }> };
  let loadError: string | null = null;

  try {
    const [listed, publishedFacets] = await Promise.all([
      propertyService.listPublished({
        q,
        page,
        pageSize: 24,
        propertyTypeName: filters.type || undefined,
        beds: filters.beds || undefined,
        priceMin: toNumber(filters.priceMin),
        priceMax: toNumber(filters.priceMax),
        sizeMin: toNumber(filters.sizeMin),
        sizeMax: toNumber(filters.sizeMax),
        priceSqftMin: toNumber(filters.priceSqftMin),
        priceSqftMax: toNumber(filters.priceSqftMax),
        completionMode: completion,
        furnishing,
        amenity: filters.amenity || undefined,
        cashbackMin: toNumber(filters.cashback),
        virtualTour: toVirtualTour(filters.viewing),
        sort,
      }),
      propertyService.listPublishedFacets(),
    ]);
    result = listed;
    facets = publishedFacets;
  } catch (error) {
    loadError = publicPageLoadError(
      error,
      "Properties are temporarily unavailable. Please try again.",
    );
    console.error("[properties] listPublished failed:", error);
  }

  const query = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value != null && value !== "" && value !== "ANY",
    ),
  ) as Record<string, string>;

  const rangeLabel = result.total
    ? `Showing ${(result.page - 1) * result.pageSize + 1}–${Math.min(
        result.page * result.pageSize,
        result.total,
      )} of ${result.total.toLocaleString("en-AE")}`
    : "0 listed";

  // Deep links to a page past the end should offer a way back, not read as
  // "no results for your filters".
  const pageOutOfRange = result.total > 0 && page > result.pageCount;

  return (
    <PublicSiteShell>
      <main>
        <section className="bg-[#f5f6f8]">
          <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-6 md:py-8">
            <PublicPropertiesFilterBar
              key={JSON.stringify(query)}
              total={result.total}
              initial={filters}
              types={facets.types}
              amenities={facets.amenities}
              rangeLabel={rangeLabel}
            />
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 py-8 md:px-6 md:py-12">
          {loadError ? (
            <div className="rounded-[20px] border border-dashed border-line bg-white px-6 py-16 text-center">
              <p className="font-display text-2xl">Temporarily unavailable</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate">
                {loadError}
              </p>
              <Link
                href="/properties"
                className="mt-6 inline-flex bg-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-dark"
              >
                Try again
              </Link>
            </div>
          ) : pageOutOfRange ? (
            <div className="rounded-[20px] border border-dashed border-line bg-white px-6 py-16 text-center">
              <p className="font-display text-2xl">That page doesn&apos;t exist</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate">
                This search has {result.pageCount} page
                {result.pageCount === 1 ? "" : "s"} of results.
              </p>
              <Link
                href={buildPageHref(query, 1)}
                className="mt-6 inline-flex rounded-full border border-ink px-5 py-2.5 text-sm font-semibold transition hover:bg-ink hover:text-white"
              >
                Back to page 1
              </Link>
            </div>
          ) : result.items.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-line bg-white px-6 py-16 text-center">
              <p className="font-display text-2xl">No matching properties</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate">
                {Object.keys(query).length
                  ? "Try removing a filter or searching a different area."
                  : "New listings are added regularly — check back soon."}
              </p>
              {Object.keys(query).length ? (
                <Link
                  href="/properties"
                  className="mt-6 inline-flex rounded-full border border-ink px-5 py-2.5 text-sm font-semibold transition hover:bg-ink hover:text-white"
                >
                  Clear filters
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((property) => (
                <PublicPropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {!loadError && result.items.length > 0 ? (
            <PropertiesPagination
              page={result.page}
              pageCount={result.pageCount}
              query={query}
            />
          ) : null}
        </section>
      </main>
    </PublicSiteShell>
  );
}
