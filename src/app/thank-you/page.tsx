import type { Metadata } from "next";
import Link from "next/link";

import { stature } from "@/config/stature";
import { StatureLeadConversion } from "@/features/marketing/stature-home/stature-ads";
import { StatureLegalShell } from "@/features/marketing/stature-home/stature-legal-shell";

export const metadata: Metadata = {
  title: "Thank you",
  description: `We have your enquiry. ${stature.legalName} will call you back.`,
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <StatureLegalShell
      eyebrow="Enquiry received"
      title="Thank you"
      lede="We have your details. Someone from Stature will call or WhatsApp you shortly."
    >
      <StatureLeadConversion />
      <p>
        If you need us sooner, call{" "}
        <a href={stature.phoneHref}>{stature.phone}</a> or email{" "}
        <a href={`mailto:${stature.email}`}>{stature.email}</a>.
      </p>
      <p>
        <Link href="/">Back to home</Link>
        {" · "}
        <Link href="/#projects">See projects</Link>
      </p>
    </StatureLegalShell>
  );
}
