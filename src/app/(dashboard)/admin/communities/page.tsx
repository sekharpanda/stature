import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { catalogRepository } from "@/repositories/catalog.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Communities",
  robots: { index: false, follow: false },
};

export default async function AdminCommunitiesPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const communities = await catalogRepository.listCommunities(org.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Communities</h1>
          <p className="mt-2 text-muted-foreground">
            Premium community pages with ROI, nearby POIs and linked projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/communities/new">Add community</Link>
        </Button>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All communities</CardTitle>
          <CardDescription>
            Nested under areas for filters and SEO hubs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {communities.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No communities yet"
              description="Create one after areas are seeded."
              className="py-12"
              actionLabel="Add community"
              actionHref="/admin/communities/new"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/communities/${c.id}`}
                          className="hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.area?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                      <td className="px-4 py-3">
                        {c.isPublished ? "Yes" : "No"}
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
