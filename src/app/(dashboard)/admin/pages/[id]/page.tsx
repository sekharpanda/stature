import { notFound } from "next/navigation";

import { CustomPageEditor } from "@/features/admin/components/custom-page-editor";
import { organizationRepository } from "@/repositories/organization.repository";
import { customPageService } from "@/services/custom-page.service";

export const metadata = {
  title: "Edit page",
  robots: { index: false, follow: false },
};

export default async function AdminEditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }
  const page = await customPageService.getById(org.id, id);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="eyebrow">CMS · Pages</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">{page.title}</h1>
        <p className="mt-2 text-muted-foreground">/{page.slug}</p>
      </div>
      <CustomPageEditor
        organizationId={org.id}
        page={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          excerpt: page.excerpt,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          workflowState: page.workflowState,
          content: page.content,
        }}
      />
    </div>
  );
}
