import type { Metadata } from "next";
import Link from "next/link";

import { stature } from "@/config/stature";
import { StatureLegalShell } from "@/features/marketing/stature-home/stature-legal-shell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${stature.legalName} collects and uses enquiry data, including Facebook and Google ads.`,
};

export default function PrivacyPage() {
  return (
    <StatureLegalShell
      eyebrow="Legal"
      title="Privacy policy"
      lede={`${stature.legalName} collects only what we need to call you back about a home, a site visit or a project enquiry.`}
    >
      <p>Last updated: 15 September 2026</p>
      <h2>Who we are</h2>
      <p>
        {stature.legalName}, Bengaluru ({stature.address}). Email{" "}
        <a href={`mailto:${stature.email}`}>{stature.email}</a>. Phone{" "}
        <a href={stature.phoneHref}>{stature.phone}</a>.
      </p>
      <h2>What we collect</h2>
      <p>
        When you submit the enquiry form or WhatsApp us, we collect your name,
        phone number, email if you give it, what you are looking for, and any
        note you type. Ads may also pass campaign tags such as utm_source,
        Facebook click IDs or Google click IDs so we know which advert you
        came from.
      </p>
      <h2>How we use it</h2>
      <p>
        We use this to call, WhatsApp or email you about properties, site
        visits, home loans or developer marketing — and to measure Facebook and
        Google ads. We do not sell your data.
      </p>
      <h2>Ads and cookies</h2>
      <p>
        We may run Meta (Facebook/Instagram) and Google Ads. Those platforms
        can set cookies or pixels to measure clicks, show ads and limit repeat
        ads. You can control ads in your Google and Meta account settings. See
        also our <Link href="/disclaimer">advertising disclaimer</Link>.
      </p>
      <h2>Storage</h2>
      <p>
        Enquiries are stored in HelloLeads CRM so our desk can call you back.
        HelloLeads processes that data on our instructions. We may also email a
        copy to {stature.email} if mail is configured. We keep leads only as
        long as we need them for the conversation and basic records. See also
        our <Link href="/cookies">cookies</Link> notice.
      </p>
      <h2>Your choices</h2>
      <p>
        Email {stature.email} to access, correct or delete your enquiry data,
        or to stop marketing messages. This notice is written for Indian
        visitors under the Digital Personal Data Protection Act, 2023.
      </p>
      <p>
        <Link href="/terms">Terms of use</Link>
        {" · "}
        <Link href="/disclaimer">Disclaimer</Link>
        {" · "}
        <Link href="/cookies">Cookies</Link>
      </p>
    </StatureLegalShell>
  );
}
