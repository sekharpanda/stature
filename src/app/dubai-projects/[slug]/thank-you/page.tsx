import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CampaignThankYouView } from "@/features/marketing/campaign-thank-you-view";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";
import {
  parseCampaignConfig,
  toPublicCampaignConfig,
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
  if (!page) return { title: "Thank you" };
  const config = parseCampaignConfig(page.schemaJson);
  return {
    title: config.leadForm.thankYouTitle || "Thank you",
    robots: { index: false, follow: false },
  };
}

export default async function DubaiProjectThankYouPage({ params }: Props) {
  const { slug } = await params;
  const page = await loadPublished(slug);
  if (!page) notFound();
  const config = toPublicCampaignConfig(parseCampaignConfig(page.schemaJson));

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A2E20] p-4 md:p-8">
      <CampaignThankYouView slug={page.slug} config={config} />
    </main>
  );
}
