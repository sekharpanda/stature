import { SeoSettingsForm } from "@/features/admin/components/seo-settings-form";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "SEO",
  robots: { index: false, follow: false },
};

export default async function AdminSeoPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const settings = await prisma.websiteSetting.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { key: "asc" },
  });

  const seoKeys = settings.filter(
    (s) =>
      s.key.toLowerCase().includes("seo") ||
      s.key.toLowerCase().includes("meta") ||
      s.key.toLowerCase().includes("og_") ||
      s.key.toLowerCase().includes("canonical"),
  );

  const display = seoKeys.length > 0 ? seoKeys : settings;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">CMS</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">SEO</h1>
        <p className="mt-2 text-muted-foreground">
          Edit organization defaults and website SEO / meta settings.
        </p>
      </div>

      <SeoSettingsForm
        organization={{
          id: org.id,
          name: org.name,
          domain: org.domain,
          primaryColor: org.primaryColor,
          defaultCurrency: org.defaultCurrency,
        }}
        settings={display.map((s) => ({
          id: s.id,
          key: s.key,
          value: s.value,
        }))}
      />
    </div>
  );
}
