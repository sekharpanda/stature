import type { Metadata } from "next";
import Link from "next/link";

import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { prisma } from "@/lib/db";
import { publicPageLoadError } from "@/lib/errors";
import { landingPagePath } from "@/lib/landing-page-url";
import { buildPageMetadata } from "@/lib/seo";
import { organizationRepository } from "@/repositories/organization.repository";
import { parseCampaignConfig } from "@/types/landing-campaign";

export const metadata: Metadata = buildPageMetadata({
  title: "Dubai projects",
  description:
    "Featured Dubai off-plan and ready projects from Prowin Properties.",
  path: "/dubai-projects",
});

export default async function DubaiProjectsIndexPage() {
  let pages: Array<{
    id: string;
    title: string;
    slug: string;
    metaDescription: string | null;
    schemaJson: unknown;
  }> = [];
  let loadError: string | null = null;

  try {
    const org = await organizationRepository.getDefault();
    if (org) {
      pages = await prisma.landingPage.findMany({
        where: {
          organizationId: org.id,
          deletedAt: null,
          workflowState: "PUBLISHED",
        },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          metaDescription: true,
          schemaJson: true,
        },
      });
    }
  } catch (error) {
    loadError = publicPageLoadError(
      error,
      "Project pages are temporarily unavailable. Please try again.",
    );
    console.error("[dubai-projects] load failed:", error);
  }

  return (
    <PublicSiteShell>
      <main>
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-[1180px] px-6 py-16">
            <p className="text-xs font-semibold tracking-[0.22em] text-red uppercase">
              Dubai projects
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">
              Current launches
            </h1>
            <p className="mt-4 max-w-[52ch] text-slate">
              Dedicated campaign pages for Google Ads and launches. Open a
              project for brochure, pricing and live inventory.
            </p>

            {loadError ? (
              <p className="mt-12 text-sm text-slate">{loadError}</p>
            ) : pages.length === 0 ? (
              <p className="mt-12 text-sm text-slate">
                New project pages will appear here once they are published.
              </p>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                {pages.map((page) => {
                  const config = parseCampaignConfig(page.schemaJson);
                  const excerpt =
                    page.metaDescription ||
                    config.hero.subheadline ||
                    config.overview.body.slice(0, 140);
                  return (
                    <Link
                      key={page.id}
                      href={landingPagePath(page.slug)}
                      className="border border-line bg-mist p-6 transition hover:border-ink/30"
                    >
                      <h2 className="font-display text-2xl">
                        {config.hero.headline || page.title}
                      </h2>
                      <p className="mt-2 text-sm text-slate">{excerpt}</p>
                      <span className="mt-4 inline-block text-sm font-semibold text-red">
                        View project →
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
