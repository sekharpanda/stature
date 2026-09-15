import Link from "next/link";

import { CreateDeveloperForm } from "@/features/admin/components/create-developer-form";
import { Button } from "@/components/ui/button";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Add Developer",
  robots: { index: false, follow: false },
};

export default async function AdminDeveloperNewPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Add developer
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create a developer profile for property cards and SEO hubs.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/developers">Back to developers</Link>
        </Button>
      </div>

      <CreateDeveloperForm organizationId={org.id} redirectOnCreate />
    </div>
  );
}
