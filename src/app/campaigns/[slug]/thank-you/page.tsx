import { redirect } from "next/navigation";

import { landingThankYouPath } from "@/lib/landing-page-url";

type Props = { params: Promise<{ slug: string }> };

export default async function LegacyCampaignThankYouRedirect({
  params,
}: Props) {
  const { slug } = await params;
  redirect(landingThankYouPath(slug));
}
