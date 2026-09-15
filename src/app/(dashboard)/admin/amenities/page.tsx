import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { CreateAmenityForm } from "@/features/admin/components/create-amenity-form";
import { catalogRepository } from "@/repositories/catalog.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Amenities",
  robots: { index: false, follow: false },
};

export default async function AdminAmenitiesPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const amenities = await catalogRepository.listAmenities(org.id);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Amenities</h1>
        <p className="mt-2 text-muted-foreground">
          Shared amenity dictionary used by Off Plan sync and manual listings.
        </p>
      </div>

      <CreateAmenityForm organizationId={org.id} />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All amenities</CardTitle>
          <CardDescription>
            {amenities.length.toLocaleString()} catalog entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {amenities.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No amenities yet"
              description="Create one above or sync Off Plan projects."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                  </tr>
                </thead>
                <tbody>
                  {amenities.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.slug}
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
