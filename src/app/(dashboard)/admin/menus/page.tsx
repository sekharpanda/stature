import { SiteChromeEditor } from "@/features/admin/components/site-chrome-editor";
import { organizationRepository } from "@/repositories/organization.repository";
import { siteChromeService } from "@/services/site-chrome.service";

export const metadata = {
  title: "Menus & footer",
  robots: { index: false, follow: false },
};

export default async function AdminMenusPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }
  const chrome = await siteChromeService.get(org.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="eyebrow">CMS · Site</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Menus & footer
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Change header links, footer columns, social profiles, opening hours
          and unused-URL redirects. Phone, email and address stay in Settings.
        </p>
      </div>
      <SiteChromeEditor organizationId={org.id} initialChrome={chrome} />
    </div>
  );
}
