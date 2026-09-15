import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { PageHero } from "@/features/marketing/page-hero";
import { PageBuilderSection } from "@/features/marketing/page-builder-section";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { prisma } from "@/lib/db";
import { buildManagedPageMetadata } from "@/lib/managed-page-metadata";
import { homepageService } from "@/services/homepage.service";
import { organizationRepository } from "@/repositories/organization.repository";
import { pageContentService } from "@/services/page-content.service";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("areas", {
    title: "Areas",
    description:
      "Explore Dubai communities where Prowin Properties sells — JVC, Business Bay, Dubai South and more.",
  });
}

type AreaCard = {
  name: string;
  subtitle: string;
  href: string;
  coverUrl: string | null;
  count: number | null;
};

const LISTABLE = {
  status: "PUBLISHED" as const,
  deletedAt: null,
};

/**
 * Prefer real communities with live inventory. The curated homepage list is
 * the fallback for a cold database.
 */
async function loadAreaCards(organizationId: string): Promise<AreaCard[]> {
  const communities = await prisma.community.findMany({
    where: {
      organizationId,
      deletedAt: null,
      properties: { some: LISTABLE },
    },
    select: {
      id: true,
      name: true,
      area: { select: { name: true } },
      _count: { select: { properties: { where: LISTABLE } } },
      properties: {
        where: LISTABLE,
        orderBy: [{ listPriority: "asc" }, { updatedAt: "desc" }],
        take: 1,
        select: {
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
    take: 60,
  });

  return communities
    .sort((a, b) => b._count.properties - a._count.properties)
    .slice(0, 24)
    .map((community) => ({
      name: community.name,
      subtitle: community.area?.name ?? "Dubai",
      href: `/properties?q=${encodeURIComponent(community.name)}`,
      coverUrl: community.properties[0]?.images[0]?.url ?? null,
      count: community._count.properties,
    }));
}

export default async function AreasPage() {
  const org = await organizationRepository.getDefault();
  const [pageContent, homepage] = await Promise.all([
    pageContentService.get("areas", org?.id),
    homepageService.getContent(org?.id),
  ]);

  let cards: AreaCard[] = [];
  if (org) {
    try {
      cards = await loadAreaCards(org.id);
    } catch (error) {
      console.error("[areas] load failed:", error);
    }
  }

  if (cards.length === 0) {
    cards = homepage.areas.items.map((area) => ({
      name: area.name,
      subtitle: area.subtitle,
      href: area.href,
      coverUrl: null,
      count: null,
    }));
  }

  return (
    <PublicSiteShell>
      <main>
        <PageHero
          eyebrow={pageContent.eyebrow}
          title={pageContent.title}
          description={pageContent.lede}
        />
        <section className="bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((area) => (
                <Link
                  key={area.name}
                  href={area.href}
                  className="group overflow-hidden border border-line bg-white transition hover:border-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#eef1f4]">
                    {area.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={area.coverUrl}
                        alt={`Property in ${area.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink/85 to-red">
                        <MapPin className="size-8 text-white/70" aria-hidden="true" />
                      </div>
                    )}
                    {area.count ? (
                      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                        {area.count} {area.count === 1 ? "project" : "projects"}
                      </span>
                    ) : null}
                  </div>
                  <div className="px-4 py-4">
                    <span className="block font-display text-xl text-ink transition group-hover:text-red">
                      {area.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate">
                      {area.subtitle}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <PageBuilderSection blocks={pageContent.blocks} />
      </main>
    </PublicSiteShell>
  );
}
