import Link from "next/link";

import { HomepageContentEditor } from "@/features/admin/components/homepage-content-editor";
import { Button } from "@/components/ui/button";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  formatTrustGoogleReviews,
  getGoogleBusinessReviews,
} from "@/services/google-business-reviews.service";
import { homepageService } from "@/services/homepage.service";

export const metadata = {
  title: "Homepage",
  robots: { index: false, follow: false },
};

export default async function AdminHomepagePage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const [homepage, googleReviews] = await Promise.all([
    homepageService.getContent(org.id),
    getGoogleBusinessReviews(),
  ]);
  const googleTrust = formatTrustGoogleReviews(googleReviews);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Homepage</h1>
          <p className="mt-2 text-muted-foreground">
            Reorder sections, drop extra widgets, and edit copy without a
            developer. Other pages are under Pages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/pages">Manage pages</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              View site
            </Link>
          </Button>
        </div>
      </div>

      <HomepageContentEditor
        organizationId={org.id}
        initialContent={homepage}
        googleTrust={googleTrust}
      />
    </div>
  );
}
