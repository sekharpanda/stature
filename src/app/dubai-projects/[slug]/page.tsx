import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdsBlockLandingView } from "@/features/marketing/ads-block-landing-view";
import { CampaignLandingView } from "@/features/marketing/campaign-landing-view";
import { PageBuilder } from "@/features/marketing/page-builder";
import { prisma } from "@/lib/db";
import { landingPagePath } from "@/lib/landing-page-url";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  parseCampaignConfig,
  toPublicCampaignConfig,
  usesLandingBlocks,
} from "@/types/landing-campaign";

type Props = { params: Promise<{ slug: string }> };

async function loadPublished(slug: string) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;
  return prisma.landingPage.findFirst({
    where: {
      organizationId: org.id,
      slug,
      deletedAt: null,
      workflowState: "PUBLISHED",
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPublished(slug);
  if (!page) return { title: "Dubai project" };
  const config = parseCampaignConfig(page.schemaJson);
  return {
    title: page.metaTitle || config.hero.headline || page.title,
    description: page.metaDescription || config.overview.body.slice(0, 160),
    keywords: config.seoKeywords || undefined,
    alternates: { canonical: landingPagePath(page.slug) },
    robots: { index: true, follow: true },
  };
}

export default async function DubaiProjectLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadPublished(slug);
  if (!page) notFound();

  const config = toPublicCampaignConfig(parseCampaignConfig(page.schemaJson));

  if (usesLandingBlocks(config)) {
    return (
      <AdsBlockLandingView
        title={page.title}
        slug={page.slug}
        config={config}
      >
        <PageBuilder blocks={config.blocks ?? []} />
      </AdsBlockLandingView>
    );
  }

  return (
    <CampaignLandingView title={page.title} slug={page.slug} config={config} />
  );
}
