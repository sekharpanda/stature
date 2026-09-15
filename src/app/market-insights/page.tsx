import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/features/marketing/page-hero";
import { PublicBlogCard } from "@/features/marketing/public-blog-card";
import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { PageBuilder } from "@/features/marketing/page-builder";
import { buildManagedPageMetadata } from "@/lib/managed-page-metadata";
import { organizationRepository } from "@/repositories/organization.repository";
import { blogService } from "@/services/blog.service";
import { homepageService } from "@/services/homepage.service";
import { pageContentService } from "@/services/page-content.service";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("market-insights", {
    title: "Market insights",
    description:
      "Dubai property market insights, area trends and off-plan benchmarks from the Prowin Properties desk.",
  });
}

export default async function MarketInsightsPage() {
  const org = await organizationRepository.getDefault();
  const [homepage, pageContent, posts] = await Promise.all([
    homepageService.getContent(org?.id),
    pageContentService.get("market-insights", org?.id),
    org
      ? blogService.listPublished(org.id, 1, 6)
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: 6,
          totalPages: 1,
        }),
  ]);

  const insight = homepage.insight;

  return (
    <PublicSiteShell>
      <main>
        <PageHero
          eyebrow={pageContent.eyebrow || insight.eyebrow}
          title={pageContent.title || insight.title}
          description={pageContent.lede || insight.body}
        />

        <section className="border-b border-line bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14">
            <div className="overflow-hidden rounded-[4px] border border-line bg-white lg:grid lg:grid-cols-2">
              <div className="relative min-h-[240px] bg-ink lg:min-h-[320px]">
                <svg
                  viewBox="0 0 500 400"
                  preserveAspectRatio="xMidYMid slice"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <rect width="500" height="400" fill="#141414" />
                  <g stroke="#A01919" strokeWidth="3" fill="none">
                    <polyline points="40,320 120,280 200,300 280,210 360,240 460,120" />
                  </g>
                  <g fill="#e9c9a0">
                    <circle cx="120" cy="280" r="4" />
                    <circle cx="280" cy="210" r="4" />
                    <circle cx="460" cy="120" r="4" />
                  </g>
                </svg>
              </div>
              <div className="px-6 py-10 md:px-10 md:py-12">
                <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
                  At a glance
                </p>
                <div className="mt-6 flex flex-wrap gap-10">
                  {insight.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="font-display text-3xl font-semibold text-red">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs tracking-wide text-slate">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-sm leading-relaxed text-slate">
                  Figures are indicative desk benchmarks for client conversations
                  — always confirm current market data with your consultant
                  before deciding.
                </p>
                <LeadModalCta
                  leadSource="insights_cta"
                  campaign="market-insights"
                  className="mt-8 inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                >
                  Speak to an advisor
                </LeadModalCta>
              </div>
            </div>
          </div>
        </section>

        {pageContent.blocks.length > 0 ? (
          <section className="border-b border-line bg-white">
            <div className="mx-auto max-w-[1180px] px-6 py-14">
              <PageBuilder blocks={pageContent.blocks} />
            </div>
          </section>
        ) : null}

        <section className="bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
                  From the desk
                </p>
                <h2 className="mt-2 font-display text-3xl md:text-4xl">
                  Latest articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-sm font-semibold text-red hover:text-red-dark"
              >
                View all posts →
              </Link>
            </div>

            {posts.items.length === 0 ? (
              <div className="border border-dashed border-line bg-white px-6 py-14 text-center">
                <p className="font-display text-2xl">Insights coming soon</p>
                <p className="mt-2 text-sm text-slate">
                  Publish posts from Admin → Blog and they’ll appear here.
                </p>
                <Link
                  href="/properties"
                  className="mt-6 inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
                >
                  Browse properties
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.items.map((post) => (
                  <PublicBlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
