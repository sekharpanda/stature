import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { PageHero } from "@/features/marketing/page-hero";
import { PageBuilderSection } from "@/features/marketing/page-builder-section";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { buildManagedPageMetadata } from "@/lib/managed-page-metadata";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";
import { DEFAULT_LIST_PRIORITY } from "@/config/priority-developers";
import { pageContentService } from "@/services/page-content.service";

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata("developers", {
    title: "Developers",
    description:
      "Browse Dubai property developers and their projects with Prowin Properties.",
  });
}

// Match the public listings rule so the counts here agree with /properties.
const LISTABLE = {
  status: "PUBLISHED" as const,
  deletedAt: null,
};

export default async function DevelopersPage() {
  const org = await organizationRepository.getDefault();
  const [content, developers] = await Promise.all([
    pageContentService.get("developers", org?.id),
    org
      ? prisma.developer.findMany({
          where: {
            organizationId: org.id,
            deletedAt: null,
            isPublished: true,
            properties: { some: LISTABLE },
          },
          orderBy: [{ listPriority: "asc" }, { name: "asc" }],
          take: 60,
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            shortDescription: true,
            headquarters: true,
            listPriority: true,
            _count: { select: { properties: { where: LISTABLE } } },
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <PublicSiteShell>
      <main>
        <PageHero
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.lede}
        />
        <section className="bg-mist">
          <div className="mx-auto max-w-[1180px] px-6 py-14">
            {developers.length === 0 ? (
              <p className="text-slate">No developers published yet.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {developers.map((d) => {
                  const featured = d.listPriority < DEFAULT_LIST_PRIORITY;
                  return (
                    <Link
                      key={d.id}
                      href={`/properties?q=${encodeURIComponent(d.name)}`}
                      className="group flex flex-col border border-line bg-white p-5 transition hover:border-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-[120px] items-center justify-start">
                          {d.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={d.logoUrl}
                              alt={`${d.name} logo`}
                              loading="lazy"
                              className="max-h-12 max-w-[120px] object-contain object-left"
                            />
                          ) : (
                            <span className="inline-flex size-12 items-center justify-center bg-mist text-slate">
                              <Building2 className="size-5" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                        {featured ? (
                          <span className="shrink-0 bg-red/10 px-2 py-1 text-[11px] font-semibold tracking-wide text-red uppercase">
                            Partner
                          </span>
                        ) : null}
                      </div>

                      <span className="mt-4 block font-display text-xl text-ink transition group-hover:text-red">
                        {d.name}
                      </span>
                      {d.shortDescription || d.headquarters ? (
                        <span className="mt-1 line-clamp-2 block text-xs text-slate">
                          {d.shortDescription || d.headquarters}
                        </span>
                      ) : null}
                      <span className="mt-auto pt-4 text-sm font-medium text-slate">
                        {d._count.properties}{" "}
                        {d._count.properties === 1 ? "project" : "projects"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
        <PageBuilderSection blocks={content.blocks} />
      </main>
    </PublicSiteShell>
  );
}
