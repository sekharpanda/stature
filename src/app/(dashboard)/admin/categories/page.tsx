import { Boxes } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { CreateCategoryForm } from "@/features/admin/components/create-category-form";
import { catalogRepository } from "@/repositories/catalog.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Property Categories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const categories = await catalogRepository.listCategories(org.id);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Property categories
        </h1>
        <p className="mt-2 text-muted-foreground">
          Taxonomy for apartments, villas, townhouses and commercial.
        </p>
      </div>

      <CreateCategoryForm organizationId={org.id} />

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All categories</CardTitle>
          <CardDescription>
            Soft-deleted records are hidden from this list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No categories yet"
              description="Create a category above to start tagging inventory."
              className="py-12"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.description ?? "—"}
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
