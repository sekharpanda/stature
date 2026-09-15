import type { Metadata } from "next";
import Link from "next/link";

import { stature } from "@/config/stature";
import { StatureLegalShell } from "@/features/marketing/stature-home/stature-legal-shell";

export const metadata: Metadata = {
  title: "Cookies",
  description: `How ${stature.legalName} uses cookies and ad pixels.`,
};

export default function CookiesPage() {
  return (
    <StatureLegalShell
      eyebrow="Legal"
      title="Cookies"
      lede="We use a few cookies and ad tags so the site works and so Facebook and Google ads can be measured."
    >
      <p>Last updated: 15 September 2026</p>
      <h2>What we use</h2>
      <p>
        Essential cookies keep the enquiry form and navigation working. If you
        arrive from a Facebook, Instagram or Google advert we may also load
        Meta Pixel and Google Ads tags. Those tags help us know which advert
        you clicked and whether an enquiry was sent.
      </p>
      <h2>What we do not do</h2>
      <p>
        We do not run a cookie wall. Ads tags only load when the IDs are set
        on this website. You can block or delete cookies in your browser, and
        you can opt out of personalised ads in your Google and Meta account
        settings.
      </p>
      <h2>More detail</h2>
      <p>
        See the <Link href="/privacy">privacy policy</Link> for how enquiry
        data is stored, and the <Link href="/disclaimer">disclaimer</Link> for
        how project information is shown in ads.
      </p>
    </StatureLegalShell>
  );
}
