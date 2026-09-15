import Link from "next/link";

import { LandingPageEditor } from "@/features/admin/components/create-landing-page-form";
import { Button } from "@/components/ui/button";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Create Landing Page",
  robots: { index: false, follow: false },
};

export default async function AdminLandingNewPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Create landing page
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Build a Google Ads landing page with the WordPress-style block
            builder, then publish to /dubai-projects/project-name.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/landing-pages">Back to landing pages</Link>
        </Button>
      </div>

      <LandingPageEditor organizationId={org.id} mode="create" />
    </div>
  );
}
