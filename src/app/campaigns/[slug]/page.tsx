import { redirect } from "next/navigation";

import { landingPagePath } from "@/lib/landing-page-url";

type Props = { params: Promise<{ slug: string }> };

export default async function LegacyCampaignRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(landingPagePath(slug));
}
