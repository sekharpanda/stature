import Link from "next/link";
import {
  Building2,
  Plus,
  RefreshCw,
  LayoutGrid,
  Table2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { OffPlanFilterBar } from "@/features/admin/components/properties/off-plan-filter-bar";
import { OffPlanPropertyCard } from "@/features/admin/components/properties/off-plan-property-card";
import { PublishToggle } from "@/features/admin/components/properties/publish-toggle";
import { propertyService } from "@/services/property.service";
import { propertySyncService } from "@/services/property-sync.service";
import { organizationRepository } from "@/repositories/organization.repository";
import { propertyRepository } from "@/repositories/property.repository";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Property Management",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(
  base: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/properties?${qs}` : "/admin/properties";
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sourceRaw = first(sp.source)?.toLowerCase();
  const statusRaw = first(sp.status)?.toUpperCase();
  const featuredRaw = first(sp.featured);
  const q = first(sp.q)?.trim() || undefined;
  const page = Number(first(sp.page) ?? "1") || 1;

  const region = first(sp.region) || undefined;
  const district = first(sp.district) || undefined;
  const developer = first(sp.developer) || undefined;
  const handover = first(sp.handover) || undefined;
  const type = first(sp.type) || undefined;
  const beds = first(sp.beds) || undefined;
  const sale = first(sp.sale) || undefined;
  const construction = first(sp.construction) || undefined;
  const price = first(sp.price) || undefined;
  const payments = first(sp.payments) || undefined;

  const source =
    sourceRaw === "leadrat"
      ? ("LEADRAT" as const)
      : sourceRaw === "manual"
        ? ("MANUAL" as const)
        : undefined;

  const status =
    statusRaw === "DRAFT" ||
    statusRaw === "PUBLISHED" ||
    statusRaw === "ARCHIVED" ||
    statusRaw === "EXPIRED"
      ? statusRaw
      : undefined;

  const featured =
    featuredRaw === "true" ? true : featuredRaw === "false" ? false : undefined;

  // Card grid is the default layout; table is opt-in via ?view=table
  const viewRaw = first(sp.view);
  const isLeadRatView = source === "LEADRAT";
  const view = viewRaw === "table" ? "table" : "grid";

  const priceRange = (() => {
    if (!price) return {};
    const [minRaw, maxRaw] = price.split("-");
    const priceMin =
      minRaw && minRaw.length > 0 ? Number(minRaw) : undefined;
    const priceMax =
      maxRaw && maxRaw.length > 0 ? Number(maxRaw) : undefined;
    return {
      ...(priceMin != null && Number.isFinite(priceMin) ? { priceMin } : {}),
      ...(priceMax != null && Number.isFinite(priceMax) ? { priceMax } : {}),
    };
  })();

  const org = await organizationRepository.getDefault();
  const facets =
    isLeadRatView && org
      ? await propertyRepository.listOffPlanFacets(org.id)
      : null;

  const typeIsId = Boolean(
    type && facets?.types.some((t) => t.value === type),
  );

  const result = await propertyService.listAdmin({
    source: isLeadRatView ? "LEADRAT" : source,
    status,
    featured,
    q,
    page,
    pageSize: view === "grid" ? 24 : 50,
    ...(isLeadRatView
      ? {
          cityId: region,
          areaId: district,
          developerId: developer,
          completionLabel: handover,
          propertyTypeId: typeIsId ? type : undefined,
          propertyTypeName: !typeIsId ? type : undefined,
          saleStatus: sale,
          constructionStatus: construction,
          beds,
          payments,
          ...priceRange,
        }
      : {}),
  });

  const lastSync = org
    ? await propertySyncService.getLastSyncSummary(org.id)
    : null;
  const syncStatus = propertySyncService.getStatus();

  const filterBase = {
    source: isLeadRatView ? "leadrat" : sourceRaw,
    status: status ? status.toLowerCase() : undefined,
    featured: featuredRaw,
    q,
    view: viewRaw === "table" || viewRaw === "grid" ? viewRaw : undefined,
    region,
    district,
    developer,
    handover,
    type,
    beds,
    sale,
    construction,
    price,
    payments,
  };

  const title =
    source === "LEADRAT"
      ? "Off Plan Projects"
      : source === "MANUAL"
        ? "Manual Properties"
        : status === "DRAFT"
          ? "Draft Properties"
          : featured
            ? "Featured Properties"
            : "All Properties";

  if (isLeadRatView) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-900 md:text-[28px]">
              Off Plan Projects
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Synced from LeadRat · publish each project to show it on the
              website
              {lastSync?.finishedAt || lastSync?.createdAt
                ? ` · Last sync ${(lastSync.finishedAt ?? lastSync.createdAt).toLocaleString()} (${lastSync.status})`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-9 rounded-lg">
              <Link href="/admin/properties/import">
                <RefreshCw className="mr-2 size-4" />
                Sync LeadRat
              </Link>
            </Button>
            <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1">
              <Link
                href={buildHref(filterBase, {
                  view: "table",
                  page: undefined,
                })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                  view === "table"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-50",
                )}
              >
                <Table2 className="size-3.5" />
                Table
              </Link>
              <Link
                href={buildHref(filterBase, {
                  view: "grid",
                  page: undefined,
                })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                  view === "grid"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-50",
                )}
              >
                <LayoutGrid className="size-3.5" />
                Grid
              </Link>
            </div>
          </div>
        </div>

        <OffPlanFilterBar
          total={result.total}
          filters={{
            q,
            region,
            district,
            developer,
            handover,
            type,
            beds,
            sale,
            construction,
            price,
            payments,
            status: status ? status.toLowerCase() : undefined,
          }}
          options={
            facets ?? {
              regions: [],
              districts: [],
              developers: [],
              handovers: [],
              types: [],
              beds: [],
              sales: [],
              constructions: [],
              prices: [],
              payments: [],
            }
          }
        />

        {result.items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Off Plan projects found"
            description="Run a LeadRat sync to import projects, or clear filters."
            actionLabel="Import from LeadRat"
            actionHref="/admin/properties/import"
            className="rounded-xl border border-neutral-200 bg-white py-16"
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {result.items.map((property) => (
              <OffPlanPropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <OffPlanTable items={result.items} />
        )}

        {result.pageCount > 1 ? (
          <div className="flex items-center justify-between gap-3 pt-1 text-sm">
            <p className="text-neutral-500">
              Page {result.page} of {result.pageCount} ·{" "}
              {result.total.toLocaleString()} total
            </p>
            <div className="flex gap-2">
              {result.page > 1 ? (
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link
                    href={buildHref(filterBase, {
                      page: String(result.page - 1),
                    })}
                  >
                    Previous
                  </Link>
                </Button>
              ) : null}
              {result.page < result.pageCount ? (
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link
                    href={buildHref(filterBase, {
                      page: String(result.page + 1),
                    })}
                  >
                    Next
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Core inventory</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Property Management
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {title} · {result.total.toLocaleString()}{" "}
            {result.total === 1 ? "listing" : "listings"}
            {syncStatus.autoSync
              ? ` · Auto-sync every ${syncStatus.autoSyncMinutes}m`
              : ""}
            {lastSync?.finishedAt || lastSync?.createdAt
              ? ` · Last sync ${
                  (lastSync.finishedAt ?? lastSync.createdAt).toLocaleString()
                } (${lastSync.status})`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-[3px]">
            <Link href="/admin/properties/import">
              <RefreshCw className="mr-2 size-4" />
              Sync LeadRat
            </Link>
          </Button>
          <Button asChild className="rounded-[3px]">
            <Link href="/admin/properties/new">
              <Plus className="mr-2 size-4" />
              Add property
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-[3px]">
        <CardHeader className="gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display text-xl">{title}</CardTitle>
            <CardDescription>
              Filter by source, status, and search. Synced LeadRat projects land
              as drafts until published.
            </CardDescription>
          </div>
            <div className="flex gap-1 rounded-md border p-1">
            <Link
              href={buildHref(filterBase, {
                view: "table",
                page: undefined,
              })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium",
                view === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Table2 className="size-3.5" />
              Table
            </Link>
            <Link
              href={buildHref(filterBase, {
                view: "grid",
                page: undefined,
              })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium",
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap gap-2" action="/admin/properties">
            {sourceRaw ? (
              <input type="hidden" name="source" value={sourceRaw} />
            ) : null}
            {status ? (
              <input type="hidden" name="status" value={status.toLowerCase()} />
            ) : null}
            {featuredRaw ? (
              <input type="hidden" name="featured" value={featuredRaw} />
            ) : null}
            {viewRaw === "table" || viewRaw === "grid" ? (
              <input type="hidden" name="view" value={viewRaw} />
            ) : null}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name, developer, LeadRat ID…"
              className="h-9 min-w-[240px] flex-1 rounded-[3px] border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" variant="secondary" className="rounded-[3px]">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "All", href: buildHref({}, { view: filterBase.view }) },
              {
                label: "LeadRat",
                href: buildHref(filterBase, {
                  source: "leadrat",
                  page: undefined,
                }),
              },
              {
                label: "Manual",
                href: buildHref(filterBase, {
                  source: "manual",
                  page: undefined,
                }),
                active: source === "MANUAL",
              },
              {
                label: "Drafts",
                href: buildHref(filterBase, {
                  status: "draft",
                  page: undefined,
                }),
                active: status === "DRAFT",
              },
              {
                label: "Published",
                href: buildHref(filterBase, {
                  status: "published",
                  page: undefined,
                }),
                active: status === "PUBLISHED",
              },
              {
                label: "Featured",
                href: buildHref(filterBase, {
                  featured: "true",
                  page: undefined,
                }),
                active: featured === true,
              },
            ].map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  chip.active
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {chip.label}
              </Link>
            ))}
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No properties found"
              description="Create a manual listing or import from LeadRat."
              actionLabel="Import from LeadRat"
              actionHref="/admin/properties/import"
              className="py-12"
            />
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {result.items.map((property) => (
                <OffPlanPropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <OffPlanTable items={result.items} />
          )}

          {result.pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 pt-2 text-sm">
              <p className="text-muted-foreground">
                Page {result.page} of {result.pageCount} ·{" "}
                {result.total.toLocaleString()} total
              </p>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-[3px]"
                  >
                    <Link
                      href={buildHref(filterBase, {
                        page: String(result.page - 1),
                      })}
                    >
                      Previous
                    </Link>
                  </Button>
                ) : null}
                {result.page < result.pageCount ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-[3px]"
                  >
                    <Link
                      href={buildHref(filterBase, {
                        page: String(result.page + 1),
                      })}
                    >
                      Next
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function OffPlanTable({
  items,
}: {
  items: Awaited<ReturnType<typeof propertyService.listAdmin>>["items"];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Property</th>
            <th className="px-4 py-3 font-medium">Developer</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">Sync</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((property) => (
            <tr
              key={property.id}
              className="border-b last:border-0 hover:bg-neutral-50/80"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {property.coverImage?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={property.coverImage.url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Building2 className="size-4 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/properties/${property.id}`}
                      className="font-medium hover:text-[#A01919]"
                    >
                      {property.name}
                    </Link>
                    <p className="truncate text-xs text-neutral-500">
                      {property.saleStatus ?? property.source}
                      {property.completionLabel
                        ? ` · ${property.completionLabel}`
                        : ""}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {property.developer?.name ?? "—"}
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {[
                  property.community?.name,
                  property.area?.name,
                  property.city?.name,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </td>
              <td className="px-4 py-3">
                {property.minPriceLabel || property.maxPriceLabel || "—"}
              </td>
              <td className="px-4 py-3">
                <PublishToggle
                  propertyId={property.id}
                  published={property.status === "PUBLISHED"}
                />
              </td>
              <td className="px-4 py-3">
                {property.sync?.status ? (
                  <Badge
                    variant={
                      property.sync.status === "SYNCED"
                        ? "default"
                        : property.sync.status === "FAILED"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {property.sync.status}
                  </Badge>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-neutral-500">
                {property.updatedAt.toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
