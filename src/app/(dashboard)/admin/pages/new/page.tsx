import { CustomPageEditor } from "@/features/admin/components/custom-page-editor";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "New page",
  robots: { index: false, follow: false },
};

export default async function AdminNewPagePage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="eyebrow">CMS · Pages</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Add a page</h1>
        <p className="mt-2 text-muted-foreground">
          Creates a public URL such as /careers. Add it to the header from
          Menus & footer when you want it in navigation.
        </p>
      </div>
      <CustomPageEditor organizationId={org.id} />
    </div>
  );
}
