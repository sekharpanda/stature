import type { Metadata } from "next";
import Link from "next/link";

import { brand } from "@/config/brand";
import { PageHero } from "@/features/marketing/page-hero";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { PublicTestimonials } from "@/features/marketing/public-testimonials";
import { PageBuilder } from "@/features/marketing/page-builder";
import { buildManagedPageMetadata } from "@/lib/managed-page-metadata";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";
import { pageContentService } from "@/services/page-content.service";
import { getGoogleBusinessReviews } from "@/services/google-business-reviews.service";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("about", {
    title: "About us",
    description:
      "Prowin Properties — Dubai real estate advisors helping investors and end-users find off-plan and ready projects.",
  });
}

export default async function AboutPage() {
  const content = await pageContentService.get("about");
  const org = await organizationRepository.getDefault();
  const [testimonials, google] = await Promise.all([
    org
      ? prisma.testimonial.findMany({
          where: { organizationId: org.id, deletedAt: null },
          orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
          take: 9,
        })
      : Promise.resolve([]),
    getGoogleBusinessReviews(),
  ]);

  return (
    <PublicSiteShell>
      <main>
        <PageHero
          size="lg"
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.lede}
        />

        {content.blocks.length > 0 ? (
          <section className="border-b border-line bg-mist">
            <div className="mx-auto max-w-[1180px] px-6 py-16">
              <PageBuilder blocks={content.blocks} />
            </div>
          </section>
        ) : null}

        <PublicTestimonials
          items={testimonials.map((t) => ({
            id: t.id,
            authorName: t.authorName,
            authorRole: t.authorRole,
            content: t.content,
            rating: t.rating != null ? Number(t.rating) : null,
          }))}
        />

        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
                Where we work
              </p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl">
                Based in Tecom, serving Dubai-wide
              </h2>
              <p className="mt-4 text-slate">{brand.address}</p>
              <div className="mt-6 space-y-2 text-sm">
                <a
                  className="block font-medium text-ink hover:text-red"
                  href={`tel:${brand.phone}`}
                >
                  {brand.phone}
                </a>
                <a
                  className="block font-medium text-ink hover:text-red"
                  href={`mailto:${brand.email}`}
                >
                  {brand.email}
                </a>
              </div>
            </div>
            <div className="border border-line bg-mist p-8">
              <p className="font-display text-2xl">
                Rated {google.rating.toFixed(1)} by clients
              </p>
              <p className="mt-2 text-sm text-slate">
                Based on {google.reviewCount}+ Google reviews for{" "}
                {brand.name}.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/properties"
                  className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                >
                  Browse properties
                </Link>
                <LeadModalCta
                  leadSource="about_cta"
                  campaign="about"
                  className="inline-flex items-center border border-ink px-5 py-3 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                >
                  Contact the team
                </LeadModalCta>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
