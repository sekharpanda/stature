import { notFound } from "next/navigation";

import { AdsBlockLandingView } from "@/features/marketing/ads-block-landing-view";
import { CampaignLandingView } from "@/features/marketing/campaign-landing-view";
import { PageBuilder } from "@/features/marketing/page-builder";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseCampaignConfig,
  toPublicCampaignConfig,
  usesLandingBlocks,
} from "@/types/landing-campaign";

export const metadata = {
  title: "Campaign preview",
  robots: { index: false, follow: false },
};

export default async function CampaignPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("cms:landing");
  const { id } = await params;

  const page = await prisma.landingPage.findFirst({
    where: { id, deletedAt: null },
  });
  if (!page) notFound();

  const config = toPublicCampaignConfig(parseCampaignConfig(page.schemaJson));

  if (usesLandingBlocks(config)) {
    return (
      <AdsBlockLandingView
        title={page.title}
        slug={page.slug}
        config={config}
        preview
      >
        <PageBuilder blocks={config.blocks ?? []} />
      </AdsBlockLandingView>
    );
  }

  return (
    <CampaignLandingView
      title={page.title}
      slug={page.slug}
      config={config}
      preview
    />
  );
}
