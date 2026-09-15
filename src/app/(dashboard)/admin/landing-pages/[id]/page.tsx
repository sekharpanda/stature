import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingPageEditor } from "@/features/admin/components/create-landing-page-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Edit Landing Page",
  robots: { index: false, follow: false },
};

export default async function AdminLandingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const page = await prisma.landingPage.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
  });
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Edit landing page
          </h1>
          <p className="mt-2 text-muted-foreground">
            {page.workflowState}
            {page.slug ? ` · /dubai-projects/${page.slug}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/preview/campaigns/${page.id}`} target="_blank">
              Preview
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/landing-pages">Back</Link>
          </Button>
        </div>
      </div>

      <LandingPageEditor
        organizationId={org.id}
        mode="edit"
        initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          campaign: page.campaign,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          workflowState: page.workflowState,
          campaignConfig: page.schemaJson,
        }}
      />
    </div>
  );
}
