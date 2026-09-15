import { Map as MapIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { CreateAreaForm } from "@/features/admin/components/create-area-form";
import { catalogRepository } from "@/repositories/catalog.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Areas",
  robots: { index: false, follow: false },
};

export default async function AdminAreasPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const [cities, areas] = await Promise.all([
    catalogRepository.listCities(org.id),
    catalogRepository.listAreas(org.id),
  ]);

  const cityName = new Map(cities.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Areas</h1>
        <p className="mt-2 text-muted-foreground">
          SEO landing hubs with investment metrics and nearby amenities.
        </p>
      </div>

      <CreateAreaForm
        organizationId={org.id}
        cities={cities.map((c) => ({ id: c.id, name: c.name }))}
      />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Dubai areas</CardTitle>
          <CardDescription>
            Manual and seeded districts powering location hubs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <EmptyState
              icon={MapIcon}
              title="No areas yet"
              description="Create one above or run seed to bootstrap Dubai locations."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{area.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {cityName.get(area.cityId) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {area.slug}
                      </td>
                      <td className="px-4 py-3">
                        {area.isPublished ? "Yes" : "No"}
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
