import type { Metadata } from "next";
import Link from "next/link";

import { stature } from "@/config/stature";
import { StatureLegalShell } from "@/features/marketing/stature-home/stature-legal-shell";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms for using the ${stature.legalName} website and enquiry form.`,
};

export default function TermsPage() {
  return (
    <StatureLegalShell
      eyebrow="Legal"
      title="Terms of use"
      lede="These terms cover this website, our enquiry form, and how we talk to you after you get in touch."
    >
      <p>Last updated: 15 September 2026</p>
      <h2>Using this site</h2>
      <p>
        {stature.legalName} provides this site for information about homes and
        services in Bengaluru. We may change copy, projects or prices without
        notice. You agree not to misuse the site or submit false enquiries.
      </p>
      <h2>Enquiries</h2>
      <p>
        Sending the lead form or WhatsApp is a request to be contacted — not a
        booking, allotment or loan approval. We try to reply on working days.
      </p>
      <h2>Projects and third parties</h2>
      <p>
        Project names, photos and starting prices are for illustration and may
        come from developers. Banks, RERA filings and the developer’s documents
        govern the actual offer. See our{" "}
        <Link href="/disclaimer">disclaimer</Link>.
      </p>
      <h2>Liability</h2>
      <p>
        We are not liable for decisions you make solely on website or ad
        content. Use site visits, sanctioned plans and registered documents
        before you pay.
      </p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, with courts in Bengaluru.</p>
      <p>
        <Link href="/privacy">Privacy policy</Link>
        {" · "}
        <Link href="/disclaimer">Disclaimer</Link>
        {" · "}
        <Link href="/cookies">Cookies</Link>
      </p>
    </StatureLegalShell>
  );
}
