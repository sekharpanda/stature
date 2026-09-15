import Link from "next/link";
import type { Metadata } from "next";
import { List } from "lucide-react";

import {
  PropertiesMap,
  type MapProperty,
} from "@/features/marketing/properties-map";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { prisma } from "@/lib/db";
import { publicPageLoadError } from "@/lib/errors";
import { locationLabel } from "@/lib/location";
import { buildPageMetadata } from "@/lib/seo";
import { organizationRepository } from "@/repositories/organization.repository";

import "leaflet/dist/leaflet.css";

export const metadata: Metadata = buildPageMetadata({
  title: "Property map",
  description:
    "Explore Prowin Properties listings across Dubai on an interactive map.",
  path: "/properties/map",
  noIndex: true,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function compactPrice(value: { toString(): string } | null, currency: string) {
  if (value == null) return null;
  const n = Number(value.toString());
  if (!Number.isFinite(n) || n <= 0) return null;
  const code = currency || "AED";
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    const rounded =
      millions >= 10
        ? Math.round(millions).toString()
        : (Math.round(millions * 10) / 10).toString().replace(/\.0$/, "");
    return `${code} ${rounded}M`;
  }
  if (n >= 1_000) return `${code} ${Math.round(n / 1_000)}K`;
  return `${code} ${Math.round(n)}`;
}

export default async function PropertiesMapPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = first(params.q)?.trim();
  const type = first(params.type);

  const listHref = (() => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const v = first(value);
      if (v) sp.set(key, v);
    }
    const s = sp.toString();
    return s ? `/properties?${s}` : "/properties";
  })();

  let properties: MapProperty[] = [];
  let loadError: string | null = null;

  try {
    const org = await organizationRepository.getDefault();
    if (org) {
      const rows = await prisma.property.findMany({
        where: {
          organizationId: org.id,
          status: "PUBLISHED",
          deletedAt: null,
          address: { latitude: { not: null }, longitude: { not: null } },
          ...(type
            ? { propertyType: { name: { equals: type, mode: "insensitive" } } }
            : {}),
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { community: { name: { contains: q, mode: "insensitive" } } },
                  { area: { name: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          slug: true,
          name: true,
          minPrice: true,
          currency: true,
          address: { select: { latitude: true, longitude: true } },
          community: { select: { name: true } },
          area: { select: { name: true } },
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { url: true },
          },
        },
        take: 5000,
      });

      properties = rows.flatMap((row) => {
        const lat = row.address?.latitude;
        const lng = row.address?.longitude;
        if (lat == null || lng == null) return [];
        return [
          {
            id: row.id,
            slug: row.slug,
            name: row.name,
            location: locationLabel([row.community?.name, row.area?.name]),
            priceLabel: compactPrice(row.minPrice, row.currency),
            coverUrl: row.images[0]?.url ?? null,
            latitude: lat,
            longitude: lng,
          },
        ];
      });
    }
  } catch (error) {
    loadError = publicPageLoadError(
      error,
      "The map is temporarily unavailable. Please try again.",
    );
    console.error("[properties/map] load failed:", error);
  }

  return (
    <PublicSiteShell>
      <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
              Property map
            </h1>
            <p className="mt-1 text-sm text-slate">
              {loadError
                ? loadError
                : `${properties.length} listing${properties.length === 1 ? "" : "s"} with map locations`}
            </p>
          </div>
          <Link
            href={listHref}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-ink px-4 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <List className="size-4" aria-hidden="true" />
            List view
          </Link>
        </div>

        {loadError ? (
          <div className="rounded-[20px] border border-dashed border-line bg-white px-6 py-16 text-center">
            <p className="font-display text-2xl">Temporarily unavailable</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate">
              {loadError}
            </p>
          </div>
        ) : (
          <PropertiesMap properties={properties} />
        )}
      </main>
    </PublicSiteShell>
  );
}
