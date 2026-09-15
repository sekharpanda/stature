import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHero } from "@/features/marketing/page-hero";
import { PublicSiteShell } from "@/features/marketing/public-site-shell";
import { PageBuilder } from "@/features/marketing/page-builder";
import { isReservedPublicSlug } from "@/services/custom-page.service";
import { customPageService } from "@/services/custom-page.service";
import { buildPageMetadata } from "@/lib/seo";
import { organizationRepository } from "@/repositories/organization.repository";
import { siteChromeService } from "@/services/site-chrome.service";

type Params = Promise<{ slug: string[] }>;

function pathFromSlug(slug: string[]) {
  return slug.filter(Boolean).join("/");
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = pathFromSlug(slug);
  const org = await organizationRepository.getDefault();
  if (!org || isReservedPublicSlug(path)) return {};
  const page = await customPageService.getPublishedBySlug(org.id, path);
  if (!page) return {};
  return buildPageMetadata({
    title: page.metaTitle || page.content.title || page.title,
    description:
      page.metaDescription ||
      page.content.metaDescription ||
      page.content.lede ||
      page.excerpt ||
      page.title,
    path: `/${path}`,
  });
}

export default async function ManagedPublicPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const path = pathFromSlug(slug);
  if (!path || isReservedPublicSlug(path)) notFound();

  const org = await organizationRepository.getDefault();
  if (!org) notFound();

  const chrome = await siteChromeService.get(org.id);
  const redirectMatch = chrome.redirects.find((item) => {
    const from = item.from.replace(/^\/+|\/+$/g, "");
    return from === path;
  });
  if (redirectMatch?.to && redirectMatch.to !== `/${path}`) {
    redirect(redirectMatch.to);
  }

  const page = await customPageService.getPublishedBySlug(org.id, path);
  if (!page) notFound();

  return (
    <PublicSiteShell>
      <PageHero
        eyebrow={page.content.eyebrow}
        title={page.content.title || page.title}
        description={page.content.lede}
      />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-[1180px] px-6 py-14">
          <PageBuilder blocks={page.content.blocks} />
        </div>
      </section>
    </PublicSiteShell>
  );
}
