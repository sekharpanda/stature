import Link from "next/link";
import { Building2 } from "lucide-react";

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
import { WorkflowBadge } from "@/features/portal/components/workflow-badge";
import { portalService } from "@/services/portal.service";

export const metadata = {
  title: "My Listings",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function money(value: { toString(): string } | null, currency: string) {
  if (value == null) return "—";
  const amount = Number(value.toString());
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return `${currency} ${amount.toLocaleString()}`;
}

export default async function PortalListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const result = await portalService.listListings({ page });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agent portal</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">My listings</h1>
          <p className="mt-2 text-muted-foreground">
            Properties assigned to you. New listings and edits are approved by a
            superadmin before buyers see them.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/my/listings/new">Add listing</Link>
        </Button>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {result.total} listing{result.total === 1 ? "" : "s"}
          </CardTitle>
          <CardDescription>
            Drafts stay private until you submit them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No listings yet"
              description="Add a property and send it for approval. Once approved it appears on the website and on your profile page."
              className="py-12"
              actionLabel="Add listing"
              actionHref="/admin/my/listings/new"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Listing</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Price from</th>
                    <th className="px-4 py-3 font-medium">Photos</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/my/listings/${item.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {[item.city?.name, item.area?.name]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {money(item.minPrice, item.currency)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {item._count.images}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <WorkflowBadge
                            state={item.workflowState}
                            fallbackLabel={
                              item.status === "PUBLISHED" ? "Live" : "Draft"
                            }
                          />
                          {result.pending.has(item.id) ? (
                            <Badge
                              variant="outline"
                              className="border-amber-300 text-amber-800 dark:text-amber-200"
                            >
                              Edit pending
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {result.page} of {result.pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  asChild={result.page > 1}
                  variant="outline"
                  size="sm"
                  disabled={result.page <= 1}
                >
                  {result.page > 1 ? (
                    <Link href={`/admin/my/listings?page=${result.page - 1}`}>
                      Previous
                    </Link>
                  ) : (
                    <span>Previous</span>
                  )}
                </Button>
                <Button
                  asChild={result.page < result.pageCount}
                  variant="outline"
                  size="sm"
                  disabled={result.page >= result.pageCount}
                >
                  {result.page < result.pageCount ? (
                    <Link href={`/admin/my/listings?page=${result.page + 1}`}>
                      Next
                    </Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
