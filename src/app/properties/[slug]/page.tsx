import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicPropertyDetailView } from "@/features/marketing/public-property-detail-view";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { isDatabaseUnavailable, NotFoundError } from "@/lib/errors";
import { buildPageMetadata } from "@/lib/seo";
import { propertyService } from "@/services/property.service";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const property = await propertyService.getPublishedBySlug(slug);
    const title = property.seo?.metaTitle || property.name;
    const description =
      property.seo?.metaDescription ||
      property.shortDescription ||
      property.description?.slice(0, 160) ||
      `Explore ${property.name} with Prowin Properties.`;
    const metadata = buildPageMetadata({
      title: property.seo?.ogTitle || title,
      description: property.seo?.ogDescription || description,
      path: `/properties/${property.slug}`,
      image: property.images[0]?.url,
    });
    metadata.title = title;

    if (property.seo?.canonicalUrl) {
      metadata.alternates = { canonical: property.seo.canonicalUrl };
    }
    return metadata;
  } catch {
    return { title: "Property" };
  }
}

export default async function PublicPropertyDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;

  let property: Awaited<ReturnType<typeof propertyService.getPublishedBySlug>>;
  try {
    property = await propertyService.getPublishedBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (isDatabaseUnavailable(error)) {
      return (
        <PublicSiteShell>
          <main className="mx-auto max-w-[720px] px-6 py-20 text-center">
            <h1 className="text-3xl font-semibold text-[#1f2937]">
              Temporarily unavailable
            </h1>
            <p className="mt-3 text-[#6b7280]">
              We&apos;re reconnecting to the database. Please refresh in a
              moment.
            </p>
            <a
              href={`/properties/${slug}`}
              className="mt-6 inline-flex rounded-full bg-[#1f2937] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </a>
          </main>
        </PublicSiteShell>
      );
    }
    throw error;
  }

  const similar = await propertyService
    .listSimilar({
      excludeId: property.id,
      areaId: property.areaId,
      communityId: property.communityId,
      developerId: property.developerId,
      propertyTypeId: property.propertyTypeId,
    })
    .catch(() => []);

  return (
    <PublicSiteShell propertyId={property.id}>
      <main>
        <PublicPropertyDetailView property={property} similar={similar} />
      </main>
    </PublicSiteShell>
  );
}
