import Link from "next/link";
import { Handshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeveloperListingOrderPanel } from "@/features/admin/components/developer-listing-order-panel";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { DEFAULT_LIST_PRIORITY } from "@/config/priority-developers";
import { catalogRepository } from "@/repositories/catalog.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Developers",
  robots: { index: false, follow: false },
};

export default async function AdminDevelopersPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const developers = await catalogRepository.listDevelopers(org.id);
  const orderItems = developers.map((d) => ({
    id: d.id,
    name: d.name,
    listPriority: d.listPriority,
    propertyCount: d._count.properties,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Developers</h1>
          <p className="mt-2 text-muted-foreground">
            Premium developer profiles powering SEO hubs and property cards.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/developers/new">Add developer</Link>
        </Button>
      </div>

      {developers.length > 0 ? (
        <DeveloperListingOrderPanel
          organizationId={org.id}
          developers={orderItems}
        />
      ) : null}

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All developers</CardTitle>
          <CardDescription>
            Manual and provider-synced developer records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {developers.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title="No developers yet"
              description="Create one or import properties from LeadRat."
              className="py-12"
              actionLabel="Add developer"
              actionHref="/admin/developers/new"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Properties</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {developers.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {d.listPriority < DEFAULT_LIST_PRIORITY
                          ? d.listPriority + 1
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/developers/${d.id}`}
                          className="hover:underline"
                        >
                          {d.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.slug}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d._count.properties}
                      </td>
                      <td className="px-4 py-3">
                        {d.isPublished ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
