import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PropertyUploadWorkspace } from "@/features/admin/components/properties/property-upload-workspace";
import { catalogRepository } from "@/repositories/catalog.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Upload Property",
  robots: { index: false, follow: false },
};

export default async function AdminNewPropertyPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const [categories, propertyTypes, developers, areas, communities, cities] =
    await Promise.all([
      catalogRepository.listCategories(org.id),
      catalogRepository.listPropertyTypes(org.id),
      catalogRepository.listDevelopers(org.id),
      catalogRepository.listAreas(org.id),
      catalogRepository.listCommunities(org.id),
      catalogRepository.listCities(org.id),
    ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Upload property
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Dubai-focused listing form with photos, YouTube, and map location.
            Use JSON upload for bulk import.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/admin/properties">Back to inventory</Link>
        </Button>
      </div>

      <PropertyUploadWorkspace
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        propertyTypes={propertyTypes.map((t) => ({ id: t.id, name: t.name }))}
        developers={developers.map((d) => ({ id: d.id, name: d.name }))}
        areas={areas.map((a) => ({ id: a.id, name: a.name }))}
        communities={communities.map((c) => ({ id: c.id, name: c.name }))}
        cities={cities.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
