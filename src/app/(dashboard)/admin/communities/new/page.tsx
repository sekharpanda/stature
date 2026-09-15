import Link from "next/link";

import { CreateCommunityForm } from "@/features/admin/components/create-community-form";
import { Button } from "@/components/ui/button";
import { catalogRepository } from "@/repositories/catalog.repository";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Add Community",
  robots: { index: false, follow: false },
};

export default async function AdminCommunityNewPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const areas = await catalogRepository.listAreas(org.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Add community
          </h1>
          <p className="mt-2 text-muted-foreground">
            Link a Dubai community to an area for filters and hubs.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/communities">Back to communities</Link>
        </Button>
      </div>

      {areas.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No areas yet.{" "}
          <Link href="/admin/areas" className="underline">
            Create an area
          </Link>{" "}
          first, then add a community.
        </p>
      ) : (
        <CreateCommunityForm
          organizationId={org.id}
          areas={areas.map((a) => ({ id: a.id, name: a.name }))}
          redirectOnCreate
        />
      )}
    </div>
  );
}
